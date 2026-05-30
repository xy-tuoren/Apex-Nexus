import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-amber-200",
        className,
      )}
      {...props}
    />
  );
}
