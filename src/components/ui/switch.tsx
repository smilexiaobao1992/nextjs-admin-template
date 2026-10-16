import * as React from "react";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type" | "role">
>(({ className, ...props }, ref) => {
  return (
    <span className={cn("relative inline-flex h-6 w-11 shrink-0 items-center", className)}>
      <input
        type="checkbox"
        role="switch"
        ref={ref}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none inline-flex h-6 w-11 items-center rounded-full border border-transparent bg-input/90 p-0.5 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50 [&>span]:translate-x-0 peer-checked:[&>span]:translate-x-5"
      >
        <span className="pointer-events-none block size-5 rounded-full bg-card shadow-xs transition-transform" />
      </span>
    </span>
  );
});
Switch.displayName = "Switch";

export { Switch };
