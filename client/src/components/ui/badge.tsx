import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold border transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-slate-300 bg-slate-100 text-slate-800",
        secondary:
          "border-slate-200 bg-slate-50 text-slate-700",
        destructive:
          "border-rose-300 bg-rose-50 text-rose-800",
        outline:
          "border-slate-300 bg-white text-slate-700",
        success:
          "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold",
        warning:
          "border-amber-300 bg-amber-50 text-amber-800 font-bold",
        royal:
          "border-purple-300 bg-purple-50 text-purple-900 font-bold",
        info:
          "border-sky-300 bg-sky-50 text-sky-900 font-bold",
        odoo:
          "border-[#714B67]/30 bg-[#714B67]/10 text-[#714B67] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
