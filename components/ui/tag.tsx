import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--hairline)] bg-[var(--surface-strong)] text-[var(--body)]",
        blue: "border-sky-200 bg-sky-50 text-sky-700",
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700",
        violet: "border-violet-200 bg-violet-50 text-violet-700",
        rose: "border-rose-200 bg-rose-50 text-rose-700",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

export function Tag({ className, tone, ...props }: TagProps) {
  return <span className={cn(tagVariants({ tone }), className)} {...props} />;
}
