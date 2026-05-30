import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-10 bg-[var(--primary)] px-5 text-[var(--on-primary)] hover:bg-[var(--primary-active)]",
        secondary:
          "h-10 border border-[var(--hairline-strong)] bg-transparent px-5 text-[var(--ink)] hover:border-[var(--ink)]/30 hover:bg-[var(--surface-strong)]",
        outline:
          "h-10 border border-[var(--hairline-strong)] bg-transparent px-5 text-[var(--ink)] hover:border-[var(--ink)]/30",
        ghost: "h-10 px-3 text-[var(--body)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4 text-sm",
        lg: "h-12 px-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
