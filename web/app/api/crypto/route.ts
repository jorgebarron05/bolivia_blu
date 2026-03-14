import { NextResponse } from "next/server";
import { getCryptoRates } from "@/lib/rates";

export async function GET() {
  const rates = await getCryptoRates();
  return NextResponse.json({ rates, fetchedAt: new Date().toISOString() });
}
