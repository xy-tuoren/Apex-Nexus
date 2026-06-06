"use client";

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                className="truncate font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-2 transition-colors hover:text-[var(--accent-strong)]"
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
  maxWidthClassName = "max-w-6xl",
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
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={`fixed inset-0 bg-slate-950/35 backdrop-blur-sm ${zIndexClassName}`}
        />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 max-h-[88vh] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-[var(--hairline)] bg-[var(--surface-card)] shadow-[0_24px_80px_rgba(15,23,42,0.24)] focus:outline-none sm:w-[calc(100%-3rem)] ${zIndexClassName} ${maxWidthClassName}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
            <div className="min-w-0 flex-1">
              <HierarchyTrail items={hierarchyTrail ?? []} />
              <DialogPrimitive.Title asChild>
                <p className="text-caption-uppercase text-[var(--muted)]">{eyebrow}</p>
              </DialogPrimitive.Title>
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
              <DialogPrimitive.Close asChild>
                <Button size="sm" type="button" variant="outline">
                  关闭
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="max-h-[calc(88vh-5rem)] overflow-auto p-4 sm:p-5">{children}</div>

          {/* Visually hidden description for accessibility */}
          <DialogPrimitive.Description className="sr-only">
            {title} — {eyebrow}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
