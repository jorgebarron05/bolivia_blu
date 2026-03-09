export type Currency = "USD" | "EUR" | "GBP" | "BRL" | "ARS";
export type CryptoCurrency = "USDT" | "BTC" | "ETH";
export type Direction = "to_bob" | "from_bob";

export interface RateData {
  official: number;
  blue: number | null;
  crypto: Record<CryptoCurrency, number | null>;
  fetchedAt: string;
}

export interface HistoricalPoint {
  date: string;
  rate: number;
}

export interface MarketplaceOffer {
  id: string;
  user_id: string;
  type: "buy" | "sell";
  currency: Currency;
  amount: number;
  rate: number;
  city: string;
  contact_wa?: string;
  contact_tg?: string;
  notes?: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
    trade_count: number;
    rating: number;
  };
}

export interface CasaDeCambio {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  hours?: string;
  buy_rate?: number;
  sell_rate?: number;
  rating: number;
  verified: boolean;
}

export interface Lang {
  code: "es" | "en";
  label: string;
}
