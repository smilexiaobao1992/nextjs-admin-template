"use client";

import type { MouseEvent } from "react";
import { SubmitButton } from "./submit-button";
import type { ButtonProps } from "./button";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (!event.defaultPrevented && !window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return <SubmitButton {...props} onClick={handleClick} />;
}
