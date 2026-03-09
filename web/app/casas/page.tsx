"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLang } from "@/app/providers";
import { fmt } from "@/lib/utils";
import { MapPin, Phone, Clock, Star, ShieldCheck, Building2 } from "lucide-react";
import type { CasaDeCambio } from "@/types";

const MOCK_CASAS: CasaDeCambio[] = [
  { id: "1", name: "Casa de Cambio Bolivia",    city: "La Paz",     address: "Av. 16 de Julio 1440", phone: "+591 2 244-0000", hours: "8:00–20:00 L–S", buy_rate: 6.92, sell_rate: 6.98, rating: 4.8, verified: true  },
  { id: "2", name: "Cambios del Oriente",        city: "Santa Cruz", address: "Calle 24 de Septiembre 132", phone: "+591 3 332-0000", hours: "8:00–21:00 L–D", buy_rate: 6.90, sell_rate: 7.00, rating: 4.6, verified: true  },
  { id: "3", name: "Cambios Cochabamba Centro",  city: "Cochabamba", address: "Av. Heroínas N-0324",  phone: "+591 4 425-0000", hours: "8:30–19:30 L–S", buy_rate: 6.91, sell_rate: 6.99, rating: 4.5, verified: false },
  { id: "4", name: "UniCambios",                 city: "La Paz",     address: "Calle Comercio 1200",  phone: "+591 2 237-0000", hours: "9:00–18:00 L–V", buy_rate: 6.93, sell_rate: 6.97, rating: 4.9, verified: true  },
  { id: "5", name: "Cambios Potosí",             city: "Potosí",     address: "Plaza 10 de Noviembre 15", phone: "+591 2 622-0000", hours: "9:00–18:00 L–S", buy_rate: 6.88, sell_rate: 6.96, rating: 4.2, verified: false },
  { id: "6", name: "Cambios Express SCZ",        city: "Santa Cruz", address: "Av. Monseñor Rivero 300", phone: "+591 3 344-0000", hours: "8:00–22:00 L–D", buy_rate: 6.91, sell_rate: 7.02, rating: 4.4, verified: true  },
];

const CITIES = ["all", "La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosí", "Sucre", "Tarija"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
      <span className="text-xs text-gray-500 ml-0.5">{rating}</span>
    </div>
  );
}

export default function CasasPage() {
  const { t } = useLang();
  const [city, setCity] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "sell_rate" | "buy_rate">("rating");

  const filtered = MOCK_CASAS
    .filter((c) => city === "all" || c.city === city)
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "sell_rate") return (a.sell_rate ?? 99) - (b.sell_rate ?? 99);
      return (b.buy_rate ?? 0) - (a.buy_rate ?? 0);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8 text-brand-600" />
          {t.casas.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.casas.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-44">
            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "Todas las ciudades" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Mejor calificación</SelectItem>
            <SelectItem value="sell_rate">Menor tasa venta</SelectItem>
            <SelectItem value="buy_rate">Mayor tasa compra</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Casa cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((casa) => (
          <Card key={casa.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{casa.name}</h3>
                    {casa.verified && (
                      <Badge variant="success" className="text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />{t.casas.verified}
                      </Badge>
                    )}
                  </div>
                  <StarRating rating={casa.rating} />
                </div>
                <Badge variant="outline">{casa.city}</Badge>
              </div>

              {/* Rates */}
              {(casa.buy_rate || casa.sell_rate) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                    <p className="text-xs text-green-600 font-medium mb-0.5">{t.casas.buy} USD</p>
                    <p className="text-xl font-bold">{casa.buy_rate ? fmt(casa.buy_rate) : "—"}</p>
                    <p className="text-xs text-gray-400">BOB/USD</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-0.5">{t.casas.sell} USD</p>
                    <p className="text-xl font-bold">{casa.sell_rate ? fmt(casa.sell_rate) : "—"}</p>
                    <p className="text-xs text-gray-400">BOB/USD</p>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{casa.address}</span>
                </div>
                {casa.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <a href={`tel:${casa.phone}`} className="hover:text-brand-600">{casa.phone}</a>
                  </div>
                )}
                {casa.hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{casa.hours}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Tasas referenciales. Confirmar directamente con la casa de cambio.
      </p>
    </div>
  );
}
