import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ rate: null, confidence: 0, count: 0 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("blue_rate_submissions")
    .select("rate, created_at")
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data?.length) {
    return NextResponse.json({ rate: null, confidence: 0, count: 0 });
  }

  const rates = data.map((r) => r.rate as number).sort((a, b) => a - b);
  const median = rates[Math.floor(rates.length / 2)];
  const confidence = Math.min(100, Math.round((rates.length / 10) * 100));

  return NextResponse.json({
    rate: parseFloat(median.toFixed(2)),
    confidence,
    count: rates.length,
    fetchedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rate = parseFloat(body.rate);

  if (!rate || rate < 5 || rate > 30) {
    return NextResponse.json({ error: "Invalid rate (must be 5–30)" }, { status: 400 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, note: "Supabase not configured — submission ignored" });
  }

  const { error } = await supabase
    .from("blue_rate_submissions")
    .insert({ rate, ip_hash: body.ip_hash ?? null });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
