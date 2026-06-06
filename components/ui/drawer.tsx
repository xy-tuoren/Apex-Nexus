"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type DrawerProps = {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  open: boolean;
  onClose: () => void;
  title: string;
  widthClassName?: string;
  zIndexClassName?: string;
};

export function Drawer({
  children,
  description,
  eyebrow,
  open,
  onClose,
  title,
  widthClassName,
  zIndexClassName,
}: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        className={cn(
          "flex w-full flex-col p-0 sm:max-w-[56rem]",
          widthClassName,
          zIndexClassName,
        )}
        side="right"
      >
        <SheetHeader className="bg-[var(--canvas-soft)]">
          {eyebrow ? <p className="text-caption-uppercase text-[var(--muted)]">{eyebrow}</p> : null}
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
