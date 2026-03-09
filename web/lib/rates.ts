import type { Currency, HistoricalPoint } from "@/types";

const BASE_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{base}.json";
const FALLBACK_API = "https://{date}.currency-api.pages.dev/v1/currencies/{base}.json";

const FALLBACK_RATES: Record<string, number> = {
  usd: 6.96, eur: 7.80, gbp: 9.10, brl: 1.21, ars: 0.0078,
};

async function fetchWithFallback(base: string, date = "latest"): Promise<number | null> {
  for (const tpl of [BASE_API, FALLBACK_API]) {
    try {
      const url = tpl.replace("{date}", date).replace("{base}", base.toLowerCase());
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      return parseFloat(data[base.toLowerCase()]["bob"]);
    } catch {
      continue;
    }
  }
  return null;
}

export async function getOfficialRate(currency: Currency): Promise<number> {
  const rate = await fetchWithFallback(currency.toLowerCase());
  return rate ?? FALLBACK_RATES[currency.toLowerCase()] ?? 6.96;
}

export async function getHistoricalRates(currency: Currency, days: number): Promise<HistoricalPoint[]> {
  const results: HistoricalPoint[] = [];
  const today = new Date();

  const promises = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - i));
    const dateStr = d.toISOString().split("T")[0];
    return fetchWithFallback(currency.toLowerCase(), dateStr).then((rate) => {
      if (rate) results.push({ date: dateStr, rate });
    });
  });

  await Promise.allSettled(promises);
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCryptoRates(): Promise<Record<string, number | null>> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=bob",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("CoinGecko error");
    const data = await res.json();
    return {
      USDT: data?.tether?.bob ?? null,
      BTC:  data?.bitcoin?.bob ?? null,
      ETH:  data?.ethereum?.bob ?? null,
    };
  } catch {
    return { USDT: null, BTC: null, ETH: null };
  }
}
