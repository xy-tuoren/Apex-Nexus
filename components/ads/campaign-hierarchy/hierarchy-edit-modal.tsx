"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HierarchyTrailItem = {
  label: string;
  name: string;
};

let bodyScrollLockCount = 0;

export function lockPageScroll() {
  bodyScrollLockCount += 1;
  if (bodyScrollLockCount !== 1 || typeof document === "undefined") {
    return;
  }

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

export function unlockPageScroll() {
  if (typeof document === "undefined") {
    return;
  }

  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount !== 0) {
    return;
  }

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

export function usePageScrollLock() {
  useEffect(() => {
    lockPageScroll();
    return unlockPageScroll;
  }, []);
}

export function HierarchyTrail({ items }: { items: HierarchyTrailItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol
      aria-label="当前层级"
      className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-snug"
    >
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex min-w-0 max-w-full items-center gap-1">
          {index > 0 ? (
            <ChevronRight
              aria-hidden
              className="h-3 w-3 shrink-0 text-[var(--muted)]"
              strokeWidth={1.75}
            />
          ) : null}
          <span className="shrink-0 text-[var(--muted)]">{item.label}:</span>
          <span className="truncate font-medium text-[var(--ink)]" title={item.name}>
            {item.name}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function HierarchyEditModalContent({
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
  usePageScrollLock();

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:p-6 ${zIndexClassName}`}
    >
      <button
        aria-label="关闭弹窗"
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />
      <section
        aria-modal="true"
        className={`relative max-h-[88vh] w-full overflow-hidden rounded-[2rem] border border-[var(--hairline)] bg-[var(--surface-card)] shadow-[0_24px_80px_rgba(15,23,42,0.24)] ${maxWidthClassName}`}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <HierarchyTrail items={hierarchyTrail ?? []} />
            <p className="text-caption-uppercase text-[var(--muted)]">{eyebrow}</p>
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
            <Button size="sm" type="button" variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(88vh-5rem)] overflow-auto p-4 sm:p-5">{children}</div>
      </section>
    </div>
  );
}

export function HierarchyEditModal(props: {
  title: string;
  eyebrow: string;
  hierarchyTrail?: HierarchyTrailItem[];
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  zIndexClassName?: string;
  maxWidthClassName?: string;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(<HierarchyEditModalContent {...props} />, document.body);
}

