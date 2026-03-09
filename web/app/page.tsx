import { Suspense } from "react";
import { getOfficialRate, getCryptoRates } from "@/lib/rates";
import { RateCard } from "@/components/rate-card";
import { ConversionCalculator } from "@/components/conversion-calculator";
import { RemittanceCalculator } from "@/components/remittance-calculator";
import { RateChart } from "@/components/rate-chart";
import { BlueRateSubmit } from "@/components/blue-rate-submit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

// Revalidate this page every 5 minutes
export const revalidate = 300;

async function getRates() {
  const [official, crypto] = await Promise.all([
    getOfficialRate("USD"),
    getCryptoRates(),
  ]);
  return { official, crypto };
}

export default async function HomePage() {
  const { official, crypto } = await getRates();

  // Seed initial rates for client components
  const initialRates = {
    official,
    blue:   null,   // populated client-side from /api/blue-rate
    crypto: {
      USDT: crypto.USDT ?? null,
      BTC:  crypto.BTC  ?? null,
      ETH:  crypto.ETH  ?? null,
    },
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="success" className="text-xs">
            <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" style={{ animationDuration: "3s" }} />
            Tasas en tiempo real
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          🇧🇴 <span className="text-brand-600">Bolivia</span> Blu
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Tu hub financiero para mover dinero en Bolivia. Oficial, blue y cripto en un solo lugar.
        </p>
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RateCard
          label="Oficial (BCB)"
          rate={official}
          currency="USD"
          variant="official"
        />
        <Suspense fallback={<RateCard label="Blue / Paralelo" rate={null} currency="USD" variant="blue" loading />}>
          <BlueRateCardServer />
        </Suspense>
        <RateCard
          label="USDT / Cripto"
          rate={crypto.USDT}
          baseRate={official}
          currency="USD"
          variant="crypto"
          subLabel={`BTC: ${crypto.BTC ? `Bs ${crypto.BTC.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "N/D"}`}
        />
      </div>

      {/* Blue rate crowdsource bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">¿Sabés el tipo blue hoy?</p>
              <p className="text-xs text-gray-400">Ayudá a la comunidad — los reportes se promedian con puntuación de confianza</p>
            </div>
            <BlueRateSubmit />
          </div>
        </CardContent>
      </Card>

      {/* Conversion calculator */}
      <ConversionCalculator rates={initialRates} />

      {/* Historical chart */}
      <RateChart currency="USD" blueRate={null} />

      {/* Remittance calculator */}
      <RemittanceCalculator
        officialRate={official}
        blueRate={null}
        usdtRate={crypto.USDT ?? null}
      />
    </div>
  );
}

// Async server component that fetches the crowdsourced blue rate
async function BlueRateCardServer() {
  let blueRate: number | null = null;
  let confidence = 0;
  let count = 0;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/blue-rate`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      blueRate   = data.rate;
      confidence = data.confidence;
      count      = data.count;
    }
  } catch {
    // falls back to null gracefully
  }

  return (
    <RateCard
      label="Blue / Paralelo"
      rate={blueRate}
      currency="USD"
      variant="blue"
      subLabel={blueRate ? `${count} reportes · ${confidence}% confianza` : "Sin datos — reportá arriba"}
    />
  );
}
