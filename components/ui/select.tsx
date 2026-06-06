"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  registerOption: (value: string, label: React.ReactNode) => void;
  getOptionLabel: (value: string) => React.ReactNode | undefined;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within Select");
  }
  return context;
}

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  name?: string;
  required?: boolean;
};

function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "");
  const optionsRef = React.useRef<Map<string, React.ReactNode>>(new Map());
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const registerOption = React.useCallback((optionValue: string, label: React.ReactNode) => {
    optionsRef.current.set(optionValue, label);
  }, []);

  const getOptionLabel = React.useCallback((optionValue: string) => {
    return optionsRef.current.get(optionValue);
  }, []);

  function handleValueChange(nextValue: string) {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
    setOpen(false);
  }

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        disabled,
        registerOption,
        getOptionLabel,
      }}
    >
      <PopoverPrimitive.Root modal={false} open={open} onOpenChange={setOpen}>
        {children}
      </PopoverPrimitive.Root>
    </SelectContext.Provider>
  );
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>(({ className, children, disabled: disabledProp, ...props }, ref) => {
  const { disabled: disabledContext } = useSelectContext();
  const disabled = disabledProp ?? disabledContext;

  return (
    <PopoverPrimitive.Trigger asChild disabled={disabled}>
      <button
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 text-left text-sm text-[var(--body-strong)] outline-none transition duration-200 placeholder:text-[var(--muted-soft)] hover:border-[var(--hairline-strong)] focus-visible:border-[var(--body)] focus-visible:ring-2 focus-visible:ring-[var(--body)]/10 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        disabled={disabled}
        type="button"
        {...props}
      >
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[var(--body)]" strokeWidth={1.75} />
      </button>
    </PopoverPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({
  placeholder,
  selectedLabel,
}: {
  placeholder?: React.ReactNode;
  selectedLabel?: React.ReactNode;
}) {
  const { value, getOptionLabel } = useSelectContext();
  const label = selectedLabel ?? (value ? getOptionLabel(value) : undefined);

  return (
    <span className={cn(!label && "text-[var(--muted-soft)]")}>{label ?? placeholder}</span>
  );
}

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, children, align = "start", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
        className={cn(
        "pointer-events-auto z-[1000] max-h-72 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] text-[var(--ink)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
        className,
      )}
      sideOffset={sideOffset}
      {...props}
    >
      <div className="max-h-72 overflow-y-auto p-1">{children}</div>
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & {
    value: string;
  }
>(({ className, children, value, disabled, ...props }, ref) => {
  const { value: selectedValue, onValueChange, registerOption } = useSelectContext();
  const selected = selectedValue === value;

  React.useEffect(() => {
    registerOption(value, children);
  }, [children, registerOption, value]);

  return (
    <button
      ref={ref}
      className={cn(
        "relative flex h-9 w-full cursor-default select-none items-center rounded-md py-2 pl-3 pr-9 text-left text-sm outline-none transition-colors duration-150 hover:bg-[var(--surface-strong)] disabled:pointer-events-none disabled:opacity-45",
        selected && "bg-[var(--surface-strong)]",
        className,
      )}
      disabled={disabled}
      type="button"
      onClick={() => onValueChange(value)}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected ? (
        <Check
          aria-hidden
          className="absolute right-3 h-4 w-4 text-[var(--ink)]"
          strokeWidth={1.75}
        />
      ) : null}
    </button>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
