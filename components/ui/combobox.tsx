"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  portalled?: boolean;
  searchable?: boolean;
};

function matchesQuery(option: ComboboxOption, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [option.label, option.value, ...(option.keywords ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

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
  portalled = true,
  searchable = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listboxId = React.useId();
  void portalled;

  const selected = options.find((option) => option.value === value);
  const filteredOptions = React.useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger
        render={
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
          />
        }
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-[var(--muted-soft)]")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[var(--body)]" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="pointer-events-auto z-[1000] w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-0 text-[var(--ink)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
        sideOffset={6}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Command shouldFilter={false}>
          {searchable ? (
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={(nextQuery) => {
                setQuery(nextQuery);
                onSearchChange?.(nextQuery);
              }}
            />
          ) : null}
          <CommandList
            id={listboxId}
            className="max-h-64"
            role="listbox"
            onTouchMoveCapture={(event) => event.stopPropagation()}
            onWheelCapture={(event) => event.stopPropagation()}
          >
            {filteredOptions.length ? (
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const selectedOption = option.value === value;

                  return (
                    <CommandItem
                      key={option.value}
                      className="cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--surface-strong)] data-selected:bg-[var(--surface-strong)]"
                      data-checked={selectedOption}
                      disabled={option.disabled}
                      role="option"
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  selectAllLabel?: string;
  portalled?: boolean;
  searchable?: boolean;
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
  portalled = true,
  searchable = false,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listboxId = React.useId();
  void portalled;

  const selectableValues = React.useMemo(
    () => options.filter((option) => !option.disabled).map((option) => option.value),
    [options],
  );
  const allSelected =
    selectableValues.length > 0 &&
    selectableValues.every((optionValue) => value.includes(optionValue));
  const filteredOptions = React.useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query],
  );

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
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger
        render={
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
          />
        }
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="pointer-events-auto z-[1000] w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] p-0 text-[var(--ink)] shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
        sideOffset={6}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Command shouldFilter={false}>
          {searchable ? (
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
          ) : null}
          <CommandList
            id={listboxId}
            aria-multiselectable="true"
            className="max-h-64"
            role="listbox"
            onTouchMoveCapture={(event) => event.stopPropagation()}
            onWheelCapture={(event) => event.stopPropagation()}
          >
            {filteredOptions.length || selectAllLabel ? (
              <CommandGroup>
                {selectAllLabel ? (
                  <CommandItem
                    className="cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--surface-strong)] data-selected:bg-[var(--surface-strong)]"
                    data-checked={allSelected}
                    role="option"
                    value="__select_all__"
                    onSelect={toggleSelectAll}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{selectAllLabel}</span>
                  </CommandItem>
                ) : null}
                {filteredOptions.map((option) => {
                  const selectedOption = value.includes(option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      className="cursor-pointer rounded-md px-3 py-2 hover:bg-[var(--surface-strong)] data-selected:bg-[var(--surface-strong)]"
                      data-checked={selectedOption}
                      disabled={option.disabled}
                      role="option"
                      value={option.value}
                      onSelect={() => toggleOption(option.value)}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
