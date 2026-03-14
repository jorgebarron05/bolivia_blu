import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { MarketplaceOffer } from "@/types";

const MOCK_OFFERS: MarketplaceOffer[] = [
  { id: "1", user_id: "u1", type: "sell", currency: "USD", amount: 500,  rate: 9.15, city: "Santa Cruz", contact_wa: "59170000001", created_at: new Date().toISOString(), profiles: { username: "carlos_scz", trade_count: 47, rating: 4.9 } },
  { id: "2", user_id: "u2", type: "buy",  currency: "USD", amount: 200,  rate: 9.05, city: "La Paz",     contact_tg: "@paceño_cambio", created_at: new Date().toISOString(), profiles: { username: "mario_lpz",  trade_count: 12, rating: 4.7 } },
  { id: "3", user_id: "u3", type: "sell", currency: "USD", amount: 1000, rate: 9.20, city: "Cochabamba", contact_wa: "59160000003", created_at: new Date().toISOString(), profiles: { username: "cbba_trader", trade_count: 89, rating: 4.8 } },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type     = searchParams.get("type");
  const city     = searchParams.get("city");
  const currency = searchParams.get("currency");

  const supabase = createServerClient();
  if (!supabase) {
    let filtered = MOCK_OFFERS;
    if (type)     filtered = filtered.filter((o) => o.type === type);
    if (city)     filtered = filtered.filter((o) => o.city === city);
    if (currency) filtered = filtered.filter((o) => o.currency === currency.toUpperCase());
    return NextResponse.json({ offers: filtered });
  }

  let query = supabase
    .from("offers")
    .select("*, profiles(username, avatar_url, trade_count, rating)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (type)     query = query.eq("type", type);
  if (city)     query = query.eq("city", city);
  if (currency) query = query.eq("currency", currency.toUpperCase());

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ offers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, currency, amount, rate, city, contact_wa, contact_tg, notes, user_id } = body;

  if (!type || !currency || !amount || !rate || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({
      offer: { id: Date.now().toString(), type, currency, amount, rate, city, contact_wa, contact_tg, notes, user_id, created_at: new Date().toISOString() },
    });
  }

  const { data, error } = await supabase
    .from("offers")
    .insert({ type, currency, amount, rate, city, contact_wa, contact_tg, notes, user_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ offer: data });
}
