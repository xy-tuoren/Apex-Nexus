import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-2.5 text-sm text-[var(--body-strong)] outline-none transition duration-200 placeholder:text-[var(--muted-soft)] hover:border-[var(--hairline-strong)] focus-visible:border-[var(--body)] focus-visible:ring-2 focus-visible:ring-[var(--body)]/10",
        className,
      )}
      {...props}
    />
  );
}
