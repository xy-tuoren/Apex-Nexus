import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition duration-200 placeholder:text-[var(--muted-soft)] focus-visible:border-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--ink)]/10",
        className,
      )}
      {...props}
    />
  );
}
