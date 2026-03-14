import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
        success:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
        warning:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
        danger:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        outline:  "border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300",
        crypto:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
