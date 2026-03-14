import { NextRequest, NextResponse } from "next/server";
import { getOfficialRate, getHistoricalRates } from "@/lib/rates";
import type { Currency } from "@/types";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "BRL", "ARS"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currency  = (searchParams.get("currency")?.toUpperCase() ?? "USD") as Currency;
  const days      = parseInt(searchParams.get("days") ?? "0");
  const historical = searchParams.get("historical") === "true";

  if (!CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  if (historical && days > 0) {
    const data = await getHistoricalRates(currency, Math.min(days, 180));
    return NextResponse.json({ currency, data });
  }

  const rate = await getOfficialRate(currency);
  return NextResponse.json({
    currency,
    rate,
    fetchedAt: new Date().toISOString(),
  });
}
