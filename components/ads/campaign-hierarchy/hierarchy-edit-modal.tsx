"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type HierarchyTrailItem = {
  label: string;
  name: string;
  onClick?: () => void;
};

export function HierarchyTrail({ items }: { items: HierarchyTrailItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol
      aria-label="当前层级"
      className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-snug"
    >
      {items.map((item, index) => {
        const isClickable = Boolean(item.onClick);

        return (
          <li key={`${item.label}-${index}`} className="flex min-w-0 max-w-full items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                aria-hidden
                className="h-3 w-3 shrink-0 text-[var(--muted)]"
                strokeWidth={1.75}
              />
            ) : null}
            <span className="shrink-0 text-[var(--muted)]">{item.label}:</span>
            {isClickable ? (
              <button
                type="button"
                onClick={item.onClick}
                className="truncate font-medium text-black underline decoration-black/30 underline-offset-2 transition-colors hover:text-black/70 dark:text-white dark:decoration-white/30 dark:hover:text-white/70"
                title={item.name}
              >
                {item.name}
              </button>
            ) : (
              <span className="truncate font-medium text-[var(--ink)]" title={item.name}>
                {item.name}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function HierarchyEditModal({
  title,
  eyebrow,
  hierarchyTrail,
  children,
  onClose,
  onBack,
  zIndexClassName = "z-50",
  maxWidthClassName = "sm:max-w-6xl",
}: {
  title: string;
  eyebrow: string;
  hierarchyTrail?: HierarchyTrailItem[];
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  zIndexClassName?: string;
  maxWidthClassName?: string;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`max-h-[88vh] w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-[2rem] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:w-[calc(100%-3rem)] ${zIndexClassName} ${maxWidthClassName}`}
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <HierarchyTrail items={hierarchyTrail ?? []} />
            <DialogTitle className="text-caption-uppercase text-[var(--muted)]">
              {eyebrow}
            </DialogTitle>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
              {title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onBack ? (
              <Button size="sm" type="button" variant="ghost" onClick={onBack}>
                返回
              </Button>
            ) : null}
            <DialogClose render={<Button size="sm" type="button" variant="outline" />}>
              关闭
            </DialogClose>
          </div>
        </div>
        <div className="max-h-[calc(88vh-5rem)] overflow-auto p-4 sm:p-5">{children}</div>

        <DialogDescription className="sr-only">
          {title} — {eyebrow}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
