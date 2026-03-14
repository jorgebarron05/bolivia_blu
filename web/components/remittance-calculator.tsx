"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLang } from "@/app/providers";
import { fmt, fmtBOB } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

const METHODS = [
  { id: "official",   feeUsd: 0,    feeRate: 0,     label: "Banco / oficial",    note: "Sin comisión, tipo oficial" },
  { id: "blue",       feeUsd: 0,    feeRate: 0,     label: "Dólar blue",          note: "Tasa paralela, sin banco" },
  { id: "usdt_p2p",   feeUsd: 2,    feeRate: 0.01,  label: "USDT via Binance P2P", note: "~1% + $2 red" },
  { id: "wise",       feeUsd: 3.5,  feeRate: 0.006, label: "Wise",                note: "~0.6% + $3.50 fijo" },
  { id: "western",    feeUsd: 8,    feeRate: 0.02,  label: "Western Union",        note: "~2% + $8 fijo" },
];

interface Props {
  officialRate: number | null;
  blueRate: number | null;
  usdtRate: number | null;
}

export function RemittanceCalculator({ officialRate, blueRate, usdtRate }: Props) {
  const { t } = useLang();
  const [sending, setSending] = useState(200);

  const rateFor: Record<string, number | null> = {
    official: officialRate,
    blue:     blueRate,
    usdt_p2p: usdtRate,
    wise:     officialRate,
    western:  officialRate,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          {t.remittance.title}
        </CardTitle>
        <p className="text-sm text-gray-500">{t.remittance.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">{t.remittance.sending} (USD)</label>
          <Input
            type="number"
            min={1}
            step={50}
            value={sending}
            onChange={(e) => setSending(parseFloat(e.target.value) || 0)}
            className="max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b dark:border-gray-800">
                <th className="pb-2 text-left font-medium">{t.remittance.method}</th>
                <th className="pb-2 text-right font-medium">{t.remittance.fee}</th>
                <th className="pb-2 text-right font-medium">{t.remittance.arrives}</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m, i) => {
                const rate = rateFor[m.id];
                const afterFees = sending - m.feeUsd - sending * m.feeRate;
                const arrives = rate ? afterFees * rate : null;

                // Highlight best
                const allArrivals = METHODS.map((x) => {
                  const r = rateFor[x.id];
                  const a = sending - x.feeUsd - sending * x.feeRate;
                  return r ? a * r : 0;
                });
                const isBest = arrives !== null && arrives === Math.max(...allArrivals);

                return (
                  <tr key={m.id} className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${isBest ? "bg-green-50 dark:bg-green-950/30" : ""}`}>
                    <td className="py-2.5">
                      <div className="font-medium flex items-center gap-1.5">
                        {isBest && <span className="text-green-600 text-xs font-bold">★</span>}
                        {m.label}
                      </div>
                      <div className="text-xs text-gray-400">{m.note}</div>
                    </td>
                    <td className="py-2.5 text-right text-gray-500">
                      {m.feeUsd > 0 || m.feeRate > 0
                        ? `$${fmt(m.feeUsd + sending * m.feeRate, 2)}`
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      {arrives ? fmtBOB(arrives) : <span className="text-gray-400">N/D</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
