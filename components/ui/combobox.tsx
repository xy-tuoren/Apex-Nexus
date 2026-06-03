"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  keywords?: string[];
  disabled?: boolean;
};

type ComboboxProps = {
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  onSearchChange?: (query: string) => void;
};

export function Combobox({
  value,
  options,
  onChange,
  placeholder = "选择",
  searchPlaceholder = "搜索",
  emptyText = "没有匹配项",
  disabled,
  className,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listboxId = React.useId();
  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, option.value, ...(option.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  return (
    <PopoverPrimitive.Root
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 text-left text-sm text-[var(--body-strong)] outline-none transition duration-200 hover:border-[var(--hairline-strong)] focus-visible:border-[var(--body)] focus-visible:ring-2 focus-visible:ring-[var(--body)]/10 disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
          disabled={disabled}
          role="combobox"
          type="button"
        >
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-[var(--muted-soft)]")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[var(--body)]" strokeWidth={1.75} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-[1000] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
          sideOffset={6}
        >
          <div className="flex h-11 items-center gap-2 border-b border-[var(--hairline)] px-3">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={1.75} />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-soft)]"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                onSearchChange?.(nextQuery);
              }}
            />
          </div>
          <div id={listboxId} className="max-h-64 overflow-y-auto p-1" role="listbox">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selectedOption = option.value === value;

                return (
                  <button
                    key={option.value}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-45",
                      selectedOption && "bg-[var(--surface-strong)]",
                    )}
                    disabled={option.disabled}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {selectedOption ? (
                      <Check aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm text-[var(--muted)]">{emptyText}</div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

type MultiComboboxProps = {
  value: string[];
  options: ComboboxOption[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  formatValue?: (value: string[]) => string;
  /** 置顶「全选」行；点击在「全选 / 清空」之间切换 */
  selectAllLabel?: string;
};

export function MultiCombobox({
  value,
  options,
  onChange,
  placeholder = "选择",
  searchPlaceholder = "搜索",
  emptyText = "没有匹配项",
  disabled,
  className,
  formatValue,
  selectAllLabel,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listboxId = React.useId();
  const selectableValues = React.useMemo(
    () => options.filter((option) => !option.disabled).map((option) => option.value),
    [options],
  );
  const allSelected =
    selectableValues.length > 0 &&
    selectableValues.every((optionValue) => value.includes(optionValue));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, option.value, ...(option.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  const displayLabel = React.useMemo(() => {
    if (formatValue) {
      return formatValue(value);
    }
    if (!value.length) {
      return "";
    }
    return options
      .filter((option) => value.includes(option.value))
      .map((option) => option.label)
      .join("、");
  }, [formatValue, options, value]);

  function toggleOption(optionValue: string) {
    const next = value.includes(optionValue)
      ? value.filter((item) => item !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  function toggleSelectAll() {
    onChange(allSelected ? [] : [...selectableValues]);
  }

  return (
    <PopoverPrimitive.Root
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 text-left text-sm text-[var(--body-strong)] outline-none transition duration-200 hover:border-[var(--hairline-strong)] focus-visible:border-[var(--body)] focus-visible:ring-2 focus-visible:ring-[var(--body)]/10 disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
          disabled={disabled}
          role="combobox"
          type="button"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !displayLabel && "text-[var(--muted-soft)]",
            )}
          >
            {displayLabel || placeholder}
          </span>
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[var(--body)]" strokeWidth={1.75} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-[1000] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
          sideOffset={6}
        >
          <div className="flex h-11 items-center gap-2 border-b border-[var(--hairline)] px-3">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={1.75} />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted-soft)]"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div
            id={listboxId}
            aria-multiselectable="true"
            className="max-h-64 overflow-y-auto p-1"
            role="listbox"
          >
            {selectAllLabel ? (
              <button
                aria-selected={allSelected}
                className={cn(
                  "mb-1 flex h-9 w-full items-center gap-2 rounded-md border-b border-[var(--hairline)] px-3 text-left text-sm font-medium text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--surface-strong)]",
                  allSelected && "bg-[var(--surface-strong)]",
                )}
                role="option"
                type="button"
                onClick={toggleSelectAll}
              >
                <span className="min-w-0 flex-1 truncate">{selectAllLabel}</span>
                {allSelected ? (
                  <Check aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                ) : null}
              </button>
            ) : null}
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selectedOption = value.includes(option.value);

                return (
                  <button
                    key={option.value}
                    aria-selected={selectedOption}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-45",
                      selectedOption && "bg-[var(--surface-strong)]",
                    )}
                    disabled={option.disabled}
                    role="option"
                    type="button"
                    onClick={() => toggleOption(option.value)}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {selectedOption ? (
                      <Check aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm text-[var(--muted)]">{emptyText}</div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
