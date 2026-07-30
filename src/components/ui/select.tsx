"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const EMPTY_OPTION_VALUE = "__radix_empty_option__";

type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  form?: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled: boolean;
};

function toInternalValue(value: string) {
  return value === "" ? EMPTY_OPTION_VALUE : value;
}

function toFormValue(value: string) {
  return value === EMPTY_OPTION_VALUE ? "" : value;
}

function getOptions(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child) || child.type !== "option") {
      return [];
    }

    const value = String(child.props.value ?? "");
    return [{ value, label: child.props.children, disabled: Boolean(child.props.disabled) }];
  });
}

function Select({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  form,
  className,
  children,
  "aria-label": ariaLabel,
}: SelectProps) {
  const options = React.useMemo(() => getOptions(children), [children]);
  const initialValue = toInternalValue(defaultValue ?? options[0]?.value ?? "");
  const [uncontrolledValue, setUncontrolledValue] = React.useState(initialValue);
  const selectedValue = value === undefined ? uncontrolledValue : toInternalValue(value);

  const handleValueChange = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(toFormValue(nextValue));
  };

  return (
    <>
      {name ? <input type="hidden" name={name} value={toFormValue(selectedValue)} form={form} /> : null}
      <SelectPrimitive.Root
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
        form={form}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input/80 bg-card/90 px-3 py-2 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_1px_2px_rgba(62,47,35,0.06)] transition-[border-color,background-color,box-shadow] hover:border-primary/35 hover:bg-accent/35 focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground",
            className,
          )}
        >
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="z-[70] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_16px_40px_rgba(44,34,26,0.16)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <SelectPrimitive.ScrollUpButton className="flex h-8 cursor-default items-center justify-center bg-popover text-muted-foreground">
              <ChevronUp aria-hidden="true" className="size-4" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={toInternalValue(option.value)}
                  disabled={option.disabled}
                  className="relative flex min-h-9 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[state=checked]:font-medium"
                >
                  <span className="absolute left-2 flex size-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check aria-hidden="true" className="size-4 text-primary" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-8 cursor-default items-center justify-center bg-popover text-muted-foreground">
              <ChevronDown aria-hidden="true" className="size-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}

export { Select };
