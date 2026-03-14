import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabase = Boolean(url && anonKey);

// Browser client — only used when credentials are present
let _browser: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!_browser) _browser = createClient(url, anonKey);
  return _browser;
}

// Server client (API routes / server components) — lazy, never throws on missing creds
export function createServerClient(): SupabaseClient | null {
  if (!hasSupabase) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey);
}
