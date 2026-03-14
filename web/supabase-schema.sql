-- Bolivia Blu — Supabase Schema
-- Run this in Supabase SQL Editor to set up your database

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  avatar_url    text,
  trade_count   int  default 0,
  rating        numeric(3,2) default 5.0,
  created_at    timestamptz default now()
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── P2P Marketplace Offers ────────────────────────────────────────────────────
create table if not exists offers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text not null check (type in ('buy', 'sell')),
  currency    text not null check (currency in ('USD', 'EUR', 'GBP', 'BRL', 'ARS')),
  amount      numeric not null,
  rate        numeric not null,
  city        text not null,
  contact_wa  text,
  contact_tg  text,
  notes       text,
  active      bool default true,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days')
);

alter table offers enable row level security;
create policy "Active offers are public" on offers for select using (active = true);
create policy "Users can create offers" on offers for insert with check (auth.uid() = user_id);
create policy "Users can update own offers" on offers for update using (auth.uid() = user_id);
create policy "Users can delete own offers" on offers for delete using (auth.uid() = user_id);

-- Index for fast filtering
create index if not exists offers_type_city on offers(type, city);
create index if not exists offers_currency on offers(currency);

-- ── Crowdsourced Blue Rate ────────────────────────────────────────────────────
create table if not exists blue_rate_submissions (
  id          uuid primary key default gen_random_uuid(),
  rate        numeric not null check (rate > 5 and rate < 30),
  ip_hash     text,    -- hashed client IP to prevent spam
  created_at  timestamptz default now()
);

alter table blue_rate_submissions enable row level security;
create policy "Anyone can submit a blue rate" on blue_rate_submissions for insert with check (true);
create policy "Submissions readable by service role only" on blue_rate_submissions for select using (false);

-- ── Rate Alerts (optional server-side storage) ────────────────────────────────
-- Note: alerts are also stored in localStorage for offline use.
-- This table enables server-side push notifications (future feature).
create table if not exists rate_alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  rate_type    text not null check (rate_type in ('official', 'blue', 'usdt')),
  condition    text not null check (condition in ('above', 'below')),
  target       numeric not null,
  active       bool default true,
  triggered_at timestamptz,
  created_at   timestamptz default now()
);

alter table rate_alerts enable row level security;
create policy "Users see own alerts" on rate_alerts for select using (auth.uid() = user_id);
create policy "Users manage own alerts" on rate_alerts for all using (auth.uid() = user_id);
