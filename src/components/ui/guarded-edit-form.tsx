"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const DISCARD_MESSAGE = "当前修改尚未保存，放弃后本次填写的内容将不会保留。";

type PendingNavigation =
  | { type: "link"; href: string }
  | { type: "back" }
  | null;

export function GuardedEditForm({ onChange, onSubmit, ...props }: ComponentProps<"form">) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation>(null);
  const allowPopNavigation = useRef(false);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const currentHref = window.location.href;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    function guardInternalLink(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation({
        type: "link",
        href: `${destination.pathname}${destination.search}${destination.hash}`,
      });
      setDialogOpen(true);
    }

    function guardHistoryBack() {
      if (allowPopNavigation.current) {
        return;
      }

      window.history.pushState({ ...window.history.state, rbacDirtyGuard: true }, "", currentHref);
      setPendingNavigation({ type: "back" });
      setDialogOpen(true);
    }

    window.history.pushState({ ...window.history.state, rbacDirtyGuard: true }, "", currentHref);
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", guardInternalLink, true);
    window.addEventListener("popstate", guardHistoryBack);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", guardInternalLink, true);
      window.removeEventListener("popstate", guardHistoryBack);
    };
  }, [dirty]);

  function confirmNavigation() {
    const navigation = pendingNavigation;
    setDialogOpen(false);
    setPendingNavigation(null);
    setDirty(false);

    if (navigation?.type === "link") {
      router.push(navigation.href);
      return;
    }

    if (navigation?.type === "back") {
      allowPopNavigation.current = true;
      window.setTimeout(() => window.history.back(), 0);
    }
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setPendingNavigation(null);
    }
  }

  return (
    <>
      <form
        {...props}
        data-rbac-edit-form
        data-dirty={dirty ? "true" : "false"}
        onChange={(event) => {
          onChange?.(event);
          setDirty(true);
        }}
        onSubmit={(event) => {
          onSubmit?.(event);
          if (!event.defaultPrevented) {
            setDirty(false);
          }
        }}
      />
      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        title="放弃未保存的修改？"
        description={DISCARD_MESSAGE}
        confirmLabel="放弃修改"
        cancelLabel="继续编辑"
        onConfirm={confirmNavigation}
      />
    </>
  );
}

export function GuardedDirectoryLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} onClick={onClick} />;
}
