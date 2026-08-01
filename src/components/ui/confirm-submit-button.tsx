"use client";

import { LoaderCircle } from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";
import { ConfirmationDialog } from "./confirmation-dialog";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
  confirmTitle?: string;
  confirmLabel?: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  confirmTitle = "确认操作",
  confirmLabel = "确认",
  pendingLabel = "提交中…",
  children,
  disabled,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) {
      setOpen(true);
    }
  }

  function confirmSubmit() {
    setOpen(false);
    triggerRef.current?.form?.requestSubmit();
  }

  return (
    <>
      <Button
        {...props}
        ref={triggerRef}
        type="button"
        disabled={disabled || pending}
        onClick={handleClick}
      >
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        {pending ? pendingLabel : children}
      </Button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={confirmLabel}
        onConfirm={confirmSubmit}
      />
    </>
  );
}
