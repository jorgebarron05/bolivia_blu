"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLang } from "@/app/providers";
import { fmt } from "@/lib/utils";
import { MessageCircle, Send, Star, ShieldCheck, Plus, X } from "lucide-react";
import type { MarketplaceOffer, Currency } from "@/types";

const CITIES = ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosí", "Sucre", "Tarija"];
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "BRL", "ARS"];

// Mock data for demo (used when Supabase is not configured)
const MOCK_OFFERS: MarketplaceOffer[] = [
  { id: "1", user_id: "u1", type: "sell", currency: "USD", amount: 500, rate: 9.15, city: "Santa Cruz", contact_wa: "59170000001", created_at: new Date().toISOString(), profiles: { username: "carlos_scz", trade_count: 47, rating: 4.9, avatar_url: undefined } },
  { id: "2", user_id: "u2", type: "buy",  currency: "USD", amount: 200, rate: 9.05, city: "La Paz",     contact_tg: "@paceño_cambio", created_at: new Date().toISOString(), profiles: { username: "mario_lpz",  trade_count: 12, rating: 4.7, avatar_url: undefined } },
  { id: "3", user_id: "u3", type: "sell", currency: "USD", amount: 1000, rate: 9.20, city: "Cochabamba", contact_wa: "59160000003", created_at: new Date().toISOString(), profiles: { username: "cbba_trader", trade_count: 89, rating: 4.8, avatar_url: undefined } },
  { id: "4", user_id: "u4", type: "sell", currency: "EUR", amount: 300,  rate: 10.10, city: "La Paz",   contact_wa: "59170000004", created_at: new Date().toISOString(), profiles: { username: "euro_lpz",   trade_count: 23, rating: 4.6, avatar_url: undefined } },
];

function OfferCard({ offer, t }: { offer: MarketplaceOffer; t: ReturnType<typeof useLang>["t"] }) {
  const isSell = offer.type === "sell";
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={isSell ? "success" : "default"}>
                {isSell ? t.marketplace.sell : t.marketplace.buy} {offer.currency}
              </Badge>
              <Badge variant="outline">{offer.city}</Badge>
              {offer.profiles?.trade_count && offer.profiles.trade_count > 20 && (
                <Badge variant="warning">
                  <ShieldCheck className="h-3 w-3 mr-1" />{t.marketplace.verified}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {fmt(offer.rate)} <span className="text-sm font-normal text-gray-500">BOB/{offer.currency}</span>
              </p>
              <p className="text-sm text-gray-500">
                {t.marketplace.amount}: <span className="font-medium">{fmt(offer.amount, 0)} {offer.currency}</span>
              </p>
            </div>

            {offer.profiles && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 font-bold text-xs">
                  {offer.profiles.username[0].toUpperCase()}
                </div>
                <span className="font-medium">{offer.profiles.username}</span>
                <span>·</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{offer.profiles.rating}</span>
                <span>·</span>
                <span>{offer.profiles.trade_count} {t.marketplace.trades}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {offer.contact_wa && (
              <Button
                variant="success"
                size="sm"
                asChild
              >
                <a href={`https://wa.me/${offer.contact_wa.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  {t.marketplace.via_wa}
                </a>
              </Button>
            )}
            {offer.contact_tg && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://t.me/${offer.contact_tg.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {t.marketplace.via_tg}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostOfferForm({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    type: "sell" as "buy" | "sell",
    currency: "USD" as Currency,
    amount: "",
    rate: "",
    city: CITIES[0],
    contact_wa: "",
    contact_tg: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.amount || !form.rate) return;
    setLoading(true);
    try {
      await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), rate: parseFloat(form.rate) }),
      });
      onPosted();
      onClose();
    } catch {
      /* handle error */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-brand-600">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t.marketplace.post}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sell">{t.marketplace.sell}</SelectItem>
                <SelectItem value="buy">{t.marketplace.buy}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.rates.currency}</label>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.marketplace.amount}</label>
            <Input type="number" placeholder="500" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.marketplace.rate} (BOB)</label>
            <Input type="number" step="0.05" placeholder="9.15" value={form.rate} onChange={(e) => set("rate", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.marketplace.city}</label>
            <Select value={form.city} onValueChange={(v) => set("city", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">WhatsApp</label>
            <Input placeholder="+591 7..." value={form.contact_wa} onChange={(e) => set("contact_wa", e.target.value)} />
          </div>
        </div>

        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? t.common.loading : t.marketplace.post}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const { t } = useLang();
  const [offers, setOffers] = useState<MarketplaceOffer[]>(MOCK_OFFERS);
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");
  const [filterCity, setFilterCity] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const loadOffers = useCallback(() => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("type", filterType);
    if (filterCity !== "all") params.set("city", filterCity);
    fetch(`/api/offers?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.offers?.length) setOffers(d.offers); })
      .catch(() => setOffers(MOCK_OFFERS));
  }, [filterType, filterCity]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const filtered = offers.filter((o) => {
    if (filterType !== "all" && o.type !== filterType) return false;
    if (filterCity !== "all" && o.city !== filterCity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.marketplace.title}</h1>
        <p className="text-gray-500 mt-1">{t.marketplace.subtitle}</p>
      </div>

      {/* Filters + Post button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(["all", "sell", "buy"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {type === "all" ? "Todos" : type === "sell" ? t.marketplace.sell : t.marketplace.buy}
            </button>
          ))}
        </div>

        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t.marketplace.allCities} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.marketplace.allCities}</SelectItem>
            {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button className="ml-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.marketplace.post}
        </Button>
      </div>

      {showForm && (
        <PostOfferForm onClose={() => setShowForm(false)} onPosted={loadOffers} />
      )}

      {/* Offers list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">{t.marketplace.noOffers}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
