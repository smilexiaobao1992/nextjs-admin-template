"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";

const DISCARD_MESSAGE = "当前修改尚未保存，确认放弃并切换吗？";

export function GuardedEditForm({ onChange, onSubmit, ...props }: ComponentProps<"form">) {
  const [dirty, setDirty] = useState(false);
  const allowPopNavigation = useRef(false);

  useEffect(() => {
    if (!dirty) {
      return;
    }

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

      if (!window.confirm(DISCARD_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      setDirty(false);
    }

    function guardHistoryBack() {
      if (allowPopNavigation.current) {
        return;
      }

      if (!window.confirm(DISCARD_MESSAGE)) {
        window.history.pushState({ ...window.history.state, rbacDirtyGuard: true }, "", window.location.href);
        return;
      }

      allowPopNavigation.current = true;
      setDirty(false);
      window.setTimeout(() => window.history.back(), 0);
    }

    window.history.pushState({ ...window.history.state, rbacDirtyGuard: true }, "", window.location.href);
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", guardInternalLink, true);
    window.addEventListener("popstate", guardHistoryBack);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", guardInternalLink, true);
      window.removeEventListener("popstate", guardHistoryBack);
    };
  }, [dirty]);

  return (
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
  );
}

export function GuardedDirectoryLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} onClick={onClick} />;
}
