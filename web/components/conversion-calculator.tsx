"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Copy, Share2, ArrowLeftRight } from "lucide-react";
import { useLang } from "@/app/providers";
import { fmt, fmtBOB } from "@/lib/utils";
import type { Currency, CryptoCurrency } from "@/types";

interface Rates {
  official: number | null;
  blue: number | null;
  crypto: Partial<Record<CryptoCurrency, number | null>>;
}

interface ConversionCalculatorProps {
  rates: Rates;
}

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "BRL", "ARS"];
const BULK_AMOUNTS = [1, 5, 10, 20, 50, 100, 200, 500, 1000];

export function ConversionCalculator({ rates }: ConversionCalculatorProps) {
  const { t } = useLang();
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [direction, setDirection] = useState<"to_bob" | "from_bob">("to_bob");
  const [livePrices, setLivePrices] = useState<Rates>(rates);
  const [copied, setCopied] = useState(false);

  // Fetch rate for selected currency
  useEffect(() => {
    fetch(`/api/rates?currency=${currency}`)
      .then((r) => r.json())
      .then((d) => setLivePrices((prev) => ({ ...prev, official: d.rate })));
  }, [currency]);

  const official = livePrices.official;
  const blue      = livePrices.blue;
  const usdt      = livePrices.crypto?.USDT ?? null;

  function convert(rate: number | null) {
    if (!rate || !amount) return null;
    return direction === "to_bob" ? amount * rate : amount / rate;
  }

  const officialOut = convert(official);
  const blueOut     = convert(blue);
  const usdtOut     = convert(usdt);

  const best = [
    { label: t.rates.official, val: officialOut },
    { label: t.rates.blue,     val: blueOut     },
    { label: t.rates.crypto,   val: usdtOut      },
  ].filter((x) => x.val !== null).sort((a, b) => (b.val! - a.val!));

  const bestLabel = best[0]?.label;
  const outUnit   = direction === "to_bob" ? "BOB" : currency;

  const copyResult = () => {
    const text = `${amount} ${currency} → ${officialOut ? fmtBOB(officialOut) : "?"} (oficial) / ${blueOut ? fmtBOB(blueOut) : "?"} (blue) | Bolivia Blu`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareUrl = () => {
    const url = `${window.location.origin}?currency=${currency}&amount=${amount}&direction=${direction}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{t.rates.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Currency */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t.rates.currency}</label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t.rates.amount}</label>
              <Input
                type="number"
                min={0}
                step={10}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Direction */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t.rates.direction.to_bob}</label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDirection((d) => d === "to_bob" ? "from_bob" : "to_bob")}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {direction === "to_bob" ? `${currency} → BOB` : `BOB → ${currency}`}
              </Button>
            </div>
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { label: t.rates.official, val: officialOut, variant: "official" as const, rate: official },
              { label: t.rates.blue,     val: blueOut,     variant: "blue"     as const, rate: blue     },
              { label: t.rates.crypto + " (USDT)", val: usdtOut, variant: "crypto" as const, rate: usdt },
            ].map(({ label, val, variant, rate }) => {
              const diff = officialOut && val ? ((val - officialOut) / Math.abs(officialOut)) * 100 : null;
              const variantColor = {
                official: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
                blue:     "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900",
                crypto:   "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900",
              }[variant];
              const labelColor = {
                official: "text-blue-600 dark:text-blue-400",
                blue:     "text-emerald-600 dark:text-emerald-400",
                crypto:   "text-orange-600 dark:text-orange-400",
              }[variant];

              return (
                <div key={label} className={`rounded-xl border p-4 ${variantColor} ${label === bestLabel ? "ring-2 ring-green-500" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold uppercase ${labelColor}`}>{label}</span>
                    {label === bestLabel && <Badge variant="success" className="text-xs">Mejor</Badge>}
                  </div>
                  {val !== null && rate ? (
                    <>
                      <p className="text-2xl font-bold">{fmt(val)} <span className="text-sm font-normal text-gray-500">{outUnit}</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">@ {fmt(rate, 4)}</p>
                      {diff !== null && variant !== "official" && (
                        <p className={`text-xs mt-0.5 font-medium ${diff > 0 ? "rate-up" : diff < 0 ? "rate-down" : "rate-same"}`}>
                          {diff > 0 ? "+" : ""}{fmt(diff, 1)}%
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">N/D</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={copyResult}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              {copied ? t.common.copied : t.common.copy}
            </Button>
            <Button variant="outline" size="sm" onClick={shareUrl}>
              <Share2 className="h-3.5 w-3.5 mr-1" />
              {t.common.share}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk table */}
      <Card>
        <CardHeader><CardTitle>{t.bulk.title}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b dark:border-gray-800">
                  <th className="pb-2 font-medium">{t.bulk.amount}</th>
                  <th className="pb-2 font-medium text-blue-600">{t.rates.official}</th>
                  <th className="pb-2 font-medium text-emerald-600">{t.rates.blue}</th>
                  <th className="pb-2 font-medium text-orange-600">{t.rates.crypto}</th>
                </tr>
              </thead>
              <tbody>
                {BULK_AMOUNTS.map((a) => (
                  <tr key={a} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-2 font-medium">{fmt(a, 0)} {direction === "to_bob" ? currency : "BOB"}</td>
                    <td className="py-2">{official ? fmt(direction === "to_bob" ? a * official : a / official) : "—"}</td>
                    <td className="py-2">{blue     ? fmt(direction === "to_bob" ? a * blue     : a / blue)     : "—"}</td>
                    <td className="py-2">{usdt     ? fmt(direction === "to_bob" ? a * usdt     : a / usdt)     : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
