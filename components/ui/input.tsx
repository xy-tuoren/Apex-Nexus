import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-card)] px-4 text-[15px] text-[var(--ink)] outline-none transition duration-200 placeholder:text-[var(--muted-soft)] focus-visible:border-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--ink)]/10",
        className,
      )}
      {...props}
    />
  );
}
