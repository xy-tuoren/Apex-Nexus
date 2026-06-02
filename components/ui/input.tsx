import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 text-sm text-[var(--body-strong)] outline-none transition duration-200 placeholder:text-[var(--muted-soft)] hover:border-[var(--hairline-strong)] focus-visible:border-[var(--body)] focus-visible:ring-2 focus-visible:ring-[var(--body)]/10",
        className,
      )}
      {...props}
    />
  );
}
