"use client";

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type HierarchyLevel = "campaign" | "adgroup" | "ad";

const LEVEL_LABEL: Record<HierarchyLevel, string> = {
  campaign: "广告系列",
  adgroup: "广告组",
  ad: "广告",
};

const LEVEL_SHELL_CLASS: Record<HierarchyLevel, string> = {
  campaign: "rounded-3xl border-[var(--hairline)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]",
  adgroup: "rounded-2xl border-[var(--hairline)] bg-[var(--canvas-soft)]",
  ad: "rounded-2xl border-[var(--hairline-soft)] bg-[var(--surface-card)]",
};

const LEVEL_HEADER_CLASS: Record<HierarchyLevel, string> = {
  campaign: "px-4 py-4 sm:px-5",
  adgroup: "px-3 py-3",
  ad: "px-3 py-2.5",
};

const LEVEL_BODY_CLASS: Record<HierarchyLevel, string> = {
  campaign: "px-4 py-5 sm:px-5 sm:py-6",
  adgroup: "px-3 py-4",
  ad: "px-3 py-3",
};

type HierarchyItemProps = {
  level: HierarchyLevel;
  index: number;
  title: string;
  summary?: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
  onRemove?: () => void;
  canRemove?: boolean;
  nested?: boolean;
  children?: ReactNode;
};

export function HierarchyItem({
  level,
  index,
  title,
  summary,
  badge,
  expanded,
  onToggle,
  onAdd,
  addLabel = "新增",
  onRemove,
  canRemove = true,
  nested = false,
  children,
}: HierarchyItemProps) {
  const indexLabel = String(index).padStart(2, "0");

  return (
    <article className={`ads-hierarchy-item ${nested ? "is-nested min-w-0" : ""}`}>
      <div className={`overflow-hidden border transition duration-200 hover:border-[var(--hairline-strong)] ${LEVEL_SHELL_CLASS[level]}`}>
        <div className={`flex items-start gap-2 ${LEVEL_HEADER_CLASS[level]}`}>
          <button
            aria-expanded={expanded}
            className="group flex min-w-0 flex-1 items-start gap-3 text-left sm:items-center"
            type="button"
            onClick={onToggle}
          >
            <span className="module-index flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)]">
              {indexLabel}
            </span>
            <ChevronDown
              aria-hidden
              className={`mt-2 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 group-hover:text-[var(--ink)] sm:mt-0 ${
                expanded ? "rotate-0" : "-rotate-90"
              }`}
              strokeWidth={1.75}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-caption-uppercase text-[var(--muted)]">{LEVEL_LABEL[level]}</p>
                {badge ? <Badge className="normal-case tracking-normal">{badge}</Badge> : null}
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold tracking-[-0.01em] text-[var(--body-strong)]">
                {title}
              </p>
              {summary ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--muted)]">
                  {summary}
                </p>
              ) : null}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            {onAdd ? (
              <Button
                className="h-7 gap-1 px-2 text-xs sm:px-2.5"
                size="sm"
                type="button"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  onAdd();
                }}
              >
                <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{addLabel}</span>
              </Button>
            ) : null}
            {onRemove ? (
              <Button
                aria-label="删除"
                className="h-7 w-7 px-0"
                disabled={!canRemove}
                size="sm"
                type="button"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            ) : null}
          </div>
        </div>

        {expanded && children ? (
          <div className={`border-t border-[var(--hairline-soft)] ${LEVEL_BODY_CLASS[level]}`}>
            {children}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function HierarchyAddButton({
  label,
  onClick,
  nested = false,
}: {
  label: string;
  onClick: () => void;
  nested?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-2.5 text-sm font-medium text-[var(--body)] transition hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-strong)] ${
        nested ? "min-w-0" : ""
      }`}
      type="button"
      onClick={onClick}
    >
      <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}

export function HierarchySectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-caption-uppercase text-[var(--muted)]">{children}</p>
  );
}

export function HierarchySummaryCard({
  index,
  levelLabel,
  title,
  summary,
  onOpen,
  onRemove,
  canRemove = true,
}: {
  index: number;
  levelLabel: string;
  title: string;
  summary: string;
  onOpen: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  const indexLabel = String(index).padStart(2, "0");

  return (
    <div className="group relative min-w-0">
      <button
        className="flex w-full items-start gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 pr-12 text-left transition hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-strong)]"
        type="button"
        onClick={onOpen}
      >
        <span className="module-index flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--surface-strong)] text-[11px] font-semibold text-[var(--ink)]">
          {indexLabel}
        </span>
        <span className="min-w-0 flex-1">
          <p className="text-caption-uppercase text-[var(--muted)]">{levelLabel}</p>
          <p className="mt-0.5 truncate text-sm font-semibold tracking-[-0.01em] text-[var(--body-strong)]">
            {title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--muted)]">{summary}</p>
        </span>
        <ChevronRight
          aria-hidden
          className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)]"
          strokeWidth={1.75}
        />
      </button>
      {onRemove ? (
        <Button
          aria-label={`删除${levelLabel}`}
          className="absolute right-2 top-2 h-7 w-7 px-0 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
          disabled={!canRemove}
          size="sm"
          type="button"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Button>
      ) : null}
    </div>
  );
}
