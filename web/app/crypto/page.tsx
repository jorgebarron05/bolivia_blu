"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/app/providers";
import { fmt } from "@/lib/utils";
import { Bitcoin, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CryptoRates {
  USDT: number | null;
  BTC:  number | null;
  ETH:  number | null;
}

const P2P_GUIDE_STEPS = [
  { es: "Descargá la app de Binance y creá una cuenta con tu documento boliviano.", en: "Download the Binance app and create an account with your Bolivian ID." },
  { es: "Completá el KYC (verificación de identidad) — generalmente aprobado en minutos.", en: "Complete KYC (identity verification) — usually approved in minutes." },
  { es: "Comprá USDT (Tether) en el mercado P2P seleccionando vendedores que acepten BOB.", en: "Buy USDT (Tether) on the P2P market by selecting sellers who accept BOB." },
  { es: "Para vender, publicá una oferta o aceptá órdenes existentes — recibirás BOB vía transferencia bancaria o efectivo.", en: "To sell, post an offer or accept existing orders — you receive BOB via bank transfer or cash." },
  { es: "Para recibir remesas del exterior: compartí tu dirección USDT (TRC20 es la más barata en fees).", en: "To receive remittances from abroad: share your USDT address (TRC20 has lowest fees)." },
];

const REMIT_STEPS = [
  { es: "El remitente compra USDT en su país (Coinbase, Crypto.com, Binance).", en: "Sender buys USDT in their country (Coinbase, Crypto.com, Binance)." },
  { es: "Envía el USDT a la dirección TRC20 del destinatario en Bolivia (fee ~$1).", en: "Sends USDT to the recipient's TRC20 address in Bolivia (fee ~$1)." },
  { es: "El destinatario vende el USDT en Binance P2P a cambio de BOB.", en: "Recipient sells USDT on Binance P2P in exchange for BOB." },
  { es: "Total: llegás a una tasa mejor que la oficial con fee total de ~$2–3.", en: "Total: you achieve a better rate than official with total fee ~$2–3." },
];

function GuideSection({ title, steps, lang }: { title: string; steps: { es: string; en: string }[]; lang: "es" | "en" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-semibold">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <ol className="px-5 pb-5 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 pt-0.5">{step[lang]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function CryptoPage() {
  const { t, lang } = useLang();
  const [rates, setRates] = useState<CryptoRates>({ USDT: null, BTC: null, ETH: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crypto")
      .then((r) => r.json())
      .then((d) => setRates(d.rates ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const coins = [
    { key: "USDT" as const, name: "Tether USD",  symbol: "USDT", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", note: "Mejor para remesas" },
    { key: "BTC"  as const, name: "Bitcoin",      symbol: "BTC",  color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950/30",   note: "Alta volatilidad" },
    { key: "ETH"  as const, name: "Ethereum",     symbol: "ETH",  color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-950/30",   note: "Smart contracts" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bitcoin className="h-8 w-8 text-orange-500" />
          {t.crypto.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.crypto.subtitle}</p>
      </div>

      {/* Live crypto rates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {coins.map(({ key, name, symbol, color, bg, note }) => (
          <div key={key} className={`rounded-xl border border-gray-200 dark:border-gray-800 p-5 ${bg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${color}`}>{name}</p>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : rates[key] ? (
              <>
                <p className="text-2xl font-bold">
                  {key === "USDT"
                    ? fmt(rates[key]!, 2)
                    : `Bs ${rates[key]!.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                  <span className="text-sm font-normal text-gray-500 ml-1">BOB/{symbol}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{note}</p>
              </>
            ) : (
              <p className="text-gray-400 text-sm">N/D</p>
            )}
          </div>
        ))}
      </div>

      {/* USDT highlight */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-400">💡 ¿Por qué USDT?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>USDT (Tether) es una <strong>stablecoin</strong> anclada al dólar — 1 USDT = 1 USD, sin volatilidad.</p>
          <p>En Bolivia, muchos usan USDT como <strong>sustituto del dólar</strong> para:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Recibir remesas del exterior con comisiones mínimas (~$1–2)</li>
            <li>Ahorrar en dólares sin necesitar cuenta bancaria en USD</li>
            <li>Cambiar a BOB al mejor tipo via P2P</li>
            <li>Pagar servicios internacionales (freelancing, etc.)</li>
          </ul>
          <div className="pt-2">
            <Badge variant="warning">⚠️ Usá siempre la red TRC20 (Tron) — fees más bajos</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Guides */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">📖 {lang === "es" ? "Guías" : "Guides"}</h2>
        <GuideSection
          title={t.crypto.guide_p2p}
          steps={P2P_GUIDE_STEPS}
          lang={lang}
        />
        <GuideSection
          title={t.crypto.guide_remit}
          steps={REMIT_STEPS}
          lang={lang}
        />
      </div>

      {/* External links */}
      <Card>
        <CardHeader><CardTitle>🔗 Links útiles</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {[
            { label: "Binance P2P",   href: "https://p2p.binance.com" },
            { label: "CoinGecko",     href: "https://www.coingecko.com" },
            { label: "Trust Wallet",  href: "https://trustwallet.com" },
          ].map(({ label, href }) => (
            <Button key={href} variant="outline" size="sm" asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label} <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
