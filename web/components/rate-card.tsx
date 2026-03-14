"use client";

import { cn, fmt } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RateCardProps {
  label: string;
  rate: number | null;
  baseRate?: number;   // official rate, to show % diff
  currency: string;
  variant?: "official" | "blue" | "crypto";
  isBest?: boolean;
  loading?: boolean;
  subLabel?: string;
}

export function RateCard({ label, rate, baseRate, currency, variant = "official", isBest, loading, subLabel }: RateCardProps) {
  const diff = baseRate && rate ? ((rate - baseRate) / baseRate) * 100 : null;

  const variantStyles = {
    official: "border-blue-200 dark:border-blue-900",
    blue:     "border-emerald-200 dark:border-emerald-900",
    crypto:   "border-orange-200 dark:border-orange-900",
  };

  const labelStyles = {
    official: "text-blue-600 dark:text-blue-400",
    blue:     "text-emerald-600 dark:text-emerald-400",
    crypto:   "text-orange-600 dark:text-orange-400",
  };

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", variantStyles[variant], isBest && "ring-2 ring-green-500")}>
      {isBest && (
        <div className="absolute top-2 right-2">
          <Badge variant="success">Mejor tasa</Badge>
        </div>
      )}
      <CardContent className="pt-5">
        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", labelStyles[variant])}>
          {label}
        </p>

        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ) : rate ? (
          <>
            <p className="text-3xl font-bold tracking-tight">
              {fmt(rate, 2)}
              <span className="text-base font-normal text-gray-500 ml-1">BOB/{currency}</span>
            </p>
            {diff !== null && (
              <div className="flex items-center gap-1 mt-1">
                {diff > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 rate-up" />
                ) : diff < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 rate-down" />
                ) : (
                  <Minus className="h-3.5 w-3.5 rate-same" />
                )}
                <span className={cn("text-xs font-medium", diff > 0 ? "rate-up" : diff < 0 ? "rate-down" : "rate-same")}>
                  {diff > 0 ? "+" : ""}{fmt(diff, 1)}% vs oficial
                </span>
              </div>
            )}
            {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
          </>
        ) : (
          <p className="text-gray-400 text-sm">No disponible</p>
        )}
      </CardContent>
    </Card>
  );
}
