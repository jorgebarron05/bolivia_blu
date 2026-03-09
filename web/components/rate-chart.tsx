"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/app/providers";
import type { Currency, HistoricalPoint } from "@/types";

interface RateChartProps {
  currency: Currency;
  blueRate: number | null;
}

export function RateChart({ currency, blueRate }: RateChartProps) {
  const { t } = useLang();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rates?currency=${currency}&historical=true&days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [currency, days]);

  const periodOptions = [30, 90, 180];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>{t.rates.historicalChart} — {currency}/BOB</CardTitle>
          <div className="flex gap-1">
            {periodOptions.map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">{t.common.loading}</div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">{t.common.error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(4)} BOB`, t.rates.official]}
                labelFormatter={(l) => `Fecha: ${l}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                name={t.rates.official}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {blueRate && (
                <ReferenceLine
                  y={blueRate}
                  stroke="#f97316"
                  strokeDasharray="4 4"
                  label={{ value: t.rates.blue, position: "insideBottomRight", fontSize: 11, fill: "#f97316" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
