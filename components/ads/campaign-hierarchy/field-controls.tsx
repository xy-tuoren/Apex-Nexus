"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronDown, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SCHEDULE_DAYS, SCHEDULE_HOURS } from "@/components/ads/campaign-hierarchy/constants";
import {
  fileToLogoDataUrl,
  formatHour,
  joinLines,
  joinMultiline,
  splitLines,
  splitMultiline,
  youtubeThumbnailUrl,
  youtubeVideoIdFromInput,
} from "@/components/ads/campaign-hierarchy/form-utils";
import type { ScheduleGridValue } from "@/components/ads/campaign-hierarchy/types";

export function Field({
  label,
  children,
  hint,
  error,
  required = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid min-w-0 gap-1.5 ${className}`}>
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-[var(--semantic-error)]">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs leading-relaxed text-[var(--semantic-error)]">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function SelectControl({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Combobox
      className={className}
      disabled={disabled}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={placeholder ? `搜索${placeholder}` : "搜索"}
      value={value}
      onChange={onChange}
    />
  );
}

export function TextList({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Textarea
      className="min-h-20"
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function AssetInputList({
  value,
  onChange,
  maxItems = 5,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  maxItems?: number;
  maxLength: number;
  placeholder: string;
}) {
  const [draftItems, setDraftItems] = useState<string[]>(() => {
    const items = splitLines(value).slice(0, maxItems);
    return items.length ? items : [""];
  });

  function commit(nextItems: string[]) {
    setDraftItems(nextItems);
    onChange(joinLines(nextItems.filter((item) => item.trim())));
  }

  function updateItem(index: number, nextValue: string) {
    const nextItems = [...draftItems];
    nextItems[index] = nextValue;
    commit(nextItems);
  }

  function addItem() {
    if (draftItems.length >= maxItems) {
      return;
    }
    commit([...draftItems, ""]);
  }

  function removeItem(index: number) {
    const nextItems = draftItems.filter((_, itemIndex) => itemIndex !== index);
    commit(nextItems.length ? nextItems : [""]);
  }

  return (
    <div className="grid gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">最多可添加 {maxItems} 条</p>
        <Button
          className="h-7 px-2.5 text-xs"
          disabled={draftItems.length >= maxItems}
          size="sm"
          type="button"
          variant="outline"
          onClick={addItem}
        >
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          添加
        </Button>
      </div>
      <div className="grid gap-2">
        {draftItems.map((item, index) => (
          <div key={index} className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Input
                maxLength={maxLength}
                placeholder={placeholder}
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
              />
              <Button
                aria-label="删除"
                className="h-10 w-10 shrink-0 rounded-lg px-0"
                disabled={draftItems.length === 1}
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
            <p className="text-right text-xs text-[var(--muted)]">
              {item.length}/{maxLength}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VideoLinkList({
  value,
  onChange,
  maxItems = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  maxItems?: number;
}) {
  const [draftItems, setDraftItems] = useState<string[]>(() => {
    const items = splitLines(value).slice(0, maxItems);
    return items.length ? items : [""];
  });

  function commit(nextItems: string[]) {
    setDraftItems(nextItems);
    onChange(joinLines(nextItems.filter((item) => item.trim())));
  }

  function updateItem(index: number, nextValue: string) {
    const nextItems = [...draftItems];
    nextItems[index] = nextValue;
    commit(nextItems);
  }

  function addItem() {
    if (draftItems.length >= maxItems) {
      return;
    }
    commit([...draftItems, ""]);
  }

  function removeItem(index: number) {
    const nextItems = draftItems.filter((_, itemIndex) => itemIndex !== index);
    commit(nextItems.length ? nextItems : [""]);
  }

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted)]">最多 {maxItems} 条 · watch / youtu.be 链接</p>
          <Button
            className="shrink-0 whitespace-nowrap"
            disabled={draftItems.length >= maxItems}
            size="sm"
            type="button"
            variant="outline"
            onClick={addItem}
          >
            <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            添加
          </Button>
        </div>

        <ul className="divide-y divide-[var(--hairline)]">
          {draftItems.map((item, index) => {
            const thumbnailUrl = youtubeThumbnailUrl(item);
            const videoId = youtubeVideoIdFromInput(item);

            return (
              <li key={index} className="p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--ink)]">视频 {index + 1}</span>
                  <Button
                    aria-label={`删除视频 ${index + 1}`}
                    className="h-7 w-7 shrink-0 rounded-md px-0"
                    disabled={draftItems.length === 1}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {thumbnailUrl ? (
                    <Image
                      alt="视频封面"
                      className="h-[4.5rem] w-full shrink-0 rounded-lg border border-[var(--hairline)] object-cover sm:w-32"
                      height={90}
                      src={thumbnailUrl}
                      unoptimized
                      width={160}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-[4.5rem] w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-strong)] sm:w-32"
                    >
                      <Video className="h-5 w-5 text-[var(--muted-soft)]" strokeWidth={1.75} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <Textarea
                      className="min-h-[2.25rem] resize-y py-2.5 text-sm leading-relaxed"
                      placeholder="https://www.youtube.com/watch?v=..."
                      rows={1}
                      spellCheck={false}
                      value={item}
                      onChange={(event) => updateItem(index, event.target.value)}
                    />
                    {thumbnailUrl && videoId ? (
                      <p className="text-xs leading-relaxed text-[var(--muted)]">
                        已识别视频 ID{" "}
                        <code className="rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink)]">
                          {videoId}
                        </code>
                      </p>
                    ) : item.trim() ? (
                      <p className="text-xs text-[var(--semantic-error)]">
                        链接无效，请输入完整 YouTube 地址
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function LogoUploadList({
  value,
  onChange,
  maxItems = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  maxItems?: number;
}) {
  const items = splitMultiline(value).slice(0, maxItems);

  return (
    <ImageUpload
      maxItems={maxItems}
      transformFile={fileToLogoDataUrl}
      value={items}
      onChange={(nextItems) => onChange(joinMultiline(nextItems))}
    />
  );
}

export function NumberStepperControl({
  value,
  min,
  step,
  onChange,
}: {
  value: string;
  min: number;
  step: number;
  onChange: (value: string) => void;
}) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : min;

  function applyDelta(delta: number) {
    const next = Math.max(min, safeValue + delta);
    onChange(Number.isInteger(step) ? String(Math.round(next)) : next.toFixed(1));
  }

  return (
    <div className="grid h-10 grid-cols-[36px_minmax(0,1fr)_36px] overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)]">
      <button
        className="border-r border-[var(--hairline)] text-base text-[var(--body)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
        type="button"
        onClick={() => applyDelta(-step)}
      >
        -
      </button>
      <input
        className="min-w-0 bg-transparent px-3 text-center text-sm text-[var(--ink)] outline-none"
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        className="border-l border-[var(--hairline)] text-base text-[var(--body)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
        type="button"
        onClick={() => applyDelta(step)}
      >
        +
      </button>
    </div>
  );
}

export function TimeSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const updatePanelPosition = useCallback(() => {
    if (!rootRef.current) {
      return;
    }

    const rect = rootRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 8;
    const panelWidth = 288;
    const rowHeight = 38;
    const panelHeight = Math.ceil(options.length / 4) * rowHeight + 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const opensAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    const top = opensAbove
      ? Math.max(viewportPadding, rect.top - panelHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - viewportPadding - panelHeight);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - viewportPadding - panelWidth,
    );

    setPanelStyle({
      left,
      top: Math.max(viewportPadding, top),
      width: panelWidth,
    });
  }, [options.length]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  return (
    <div ref={rootRef} className="relative">
      <button
        className={`flex h-9 min-w-[6.5rem] items-center justify-between rounded-lg border px-3 text-sm font-medium text-[var(--ink)] transition ${
          open
            ? "border-[var(--ink)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]"
            : "border-[var(--hairline-strong)] bg-[var(--surface-card)] hover:border-[var(--ink)]/35"
        }`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 text-[var(--body)] transition ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      {open && panelStyle
        ? createPortal(
        <div
          ref={panelRef}
          className="fixed z-[1000] rounded-2xl border border-[var(--hairline-strong)] bg-[var(--surface-card)] p-1.5 shadow-[var(--shadow-elevated)]"
          style={panelStyle}
        >
          <div className="grid grid-cols-4 gap-1">
          {options.map((option) => (
            <button
              key={option}
              className={`flex h-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition ${
                option === value
                  ? "bg-[var(--ink)] text-[var(--on-primary)]"
                  : "text-[var(--ink)] hover:bg-[var(--surface-strong)]"
              }`}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

export function SchedulePicker({
  value,
  onChange,
}: {
  value: ScheduleGridValue;
  onChange: (value: ScheduleGridValue) => void;
}) {
  const [clipboard, setClipboard] = useState<boolean[] | null>(null);
  const [clipboardDay, setClipboardDay] = useState<string | null>(null);
  const [mode, setMode] = useState<"day" | "week">("day");
  const [rangeStart, setRangeStart] = useState("0");
  const [rangeEnd, setRangeEnd] = useState("24");
  const [preview, setPreview] = useState<{ dayKey: string; hour: number } | null>(null);

  function updateDay(dayKey: string, hours: boolean[]) {
    onChange({ ...value, [dayKey]: hours });
  }

  function selectUntilHour(dayKey: string, hour: number) {
    const current = value[dayKey] ?? SCHEDULE_HOURS.map(() => false);
    updateDay(
      dayKey,
      current.map((_enabled, index) => index <= hour),
    );
  }

  function clearDay(dayKey: string) {
    updateDay(dayKey, SCHEDULE_HOURS.map(() => false));
  }

  function pasteDay(dayKey: string) {
    if (!clipboard) {
      return;
    }
    updateDay(dayKey, [...clipboard]);
  }

  function applyWeekRange() {
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    const nextHours = SCHEDULE_HOURS.map((hour) => end > start && hour >= start && hour < end);

    onChange(Object.fromEntries(SCHEDULE_DAYS.map((day) => [day.key, nextHours])) as ScheduleGridValue);
  }

  const hourOptions = Array.from({ length: 25 }, (_, hour) => hour);
  return (
    <div className="relative overflow-visible rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="mb-1.5 grid grid-cols-[auto_1fr_4.75rem] items-end gap-2">
            <div />
            <div className="grid grid-cols-7 text-center text-[11px] text-[var(--muted)]">
              {[3, 6, 9, 12, 15, 18, 21].map((hour) => (
                <span key={hour}>{formatHour(hour)}</span>
              ))}
            </div>
            <div />
          </div>

          <div className="space-y-1.5">
            {SCHEDULE_DAYS.map((day) => {
              const hours = value[day.key] ?? SCHEDULE_HOURS.map(() => false);
              const hasCopiedOtherDay = Boolean(clipboard && clipboardDay !== day.key);

              return (
                <div key={day.key} className="grid grid-cols-[auto_1fr_4.75rem] items-center gap-2">
                  <span className="whitespace-nowrap text-right text-[11px] font-semibold text-[var(--muted)]">
                    {day.label}
                  </span>
                  <div
                    className="grid h-5 overflow-hidden rounded-md border border-[var(--hairline)]"
                    style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
                    onMouseLeave={() => setPreview(null)}
                  >
                    {hours.map((enabled, hour) => {
                      const previewed = preview?.dayKey === day.key && hour <= preview.hour;

                      return (
                        <button
                          key={hour}
                          aria-label={`${day.label} ${formatHour(hour)}`}
                          className={`border-r border-[var(--hairline)] transition-colors last:border-r-0 ${
                            enabled
                              ? "bg-[var(--body)]"
                              : previewed
                                ? "bg-[var(--muted-soft)]"
                                : "bg-[var(--surface-strong)]"
                          }`}
                          type="button"
                          onClick={() => selectUntilHour(day.key, hour)}
                          onMouseEnter={() => setPreview({ dayKey: day.key, hour })}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      className="h-6 min-w-[2.25rem] px-1.5 text-[11px]"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => clearDay(day.key)}
                    >
                      清空
                    </Button>
                    <Button
                      className="h-6 min-w-[2.25rem] px-1.5 text-[11px]"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (hasCopiedOtherDay) {
                          pasteDay(day.key);
                          return;
                        }
                        setClipboard([...hours]);
                        setClipboardDay(day.key);
                      }}
                    >
                      {hasCopiedOtherDay ? "粘贴" : "复制"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr_4.75rem] items-center gap-2">
        <Label className="whitespace-nowrap text-right text-xs normal-case tracking-normal text-[var(--body-strong)]">
          时间范围
        </Label>
        <div className="col-span-2 flex min-w-0 flex-nowrap items-center gap-2.5">
          <div className="inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)] p-0.5">
            <button
              className={`h-7 rounded-full px-3 text-xs font-medium transition ${
                mode === "day"
                  ? "bg-[var(--ink)] text-[var(--on-primary)]"
                  : "text-[var(--body)] hover:text-[var(--ink)]"
              }`}
              type="button"
              onClick={() => setMode("day")}
            >
              按天
            </button>
            <button
              className={`h-7 rounded-full px-3 text-xs font-medium transition ${
                mode === "week"
                  ? "bg-[var(--ink)] text-[var(--on-primary)]"
                  : "text-[var(--body)] hover:text-[var(--ink)]"
              }`}
              type="button"
              onClick={() => setMode("week")}
            >
              按周
            </button>
          </div>
          {mode === "week" ? (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">
              <TimeSelect
                options={hourOptions.slice(0, 24).map((hour) => formatHour(hour))}
                value={formatHour(Number(rangeStart))}
                onChange={(next) => setRangeStart(String(Number(next.slice(0, 2))))}
              />
              <TimeSelect
                options={hourOptions.slice(1).map((hour) => formatHour(hour))}
                value={formatHour(Number(rangeEnd))}
                onChange={(next) => setRangeEnd(String(Number(next.slice(0, 2))))}
              />
              <Button
                className="flex h-9 items-center justify-center rounded-lg px-3 text-sm"
                type="button"
                variant="outline"
                onClick={applyWeekRange}
              >
                应用
              </Button>
            </div>
          ) : null}
          <p className="shrink-0 whitespace-nowrap text-[11px] text-[var(--muted)]">
            {mode === "week" ? "按周会覆盖全部日期" : "按天直接在图表点选"}
          </p>
        </div>
      </div>
    </div>
  );
}
