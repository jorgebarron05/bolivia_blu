"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLang } from "@/app/providers";
import { fmt } from "@/lib/utils";
import { Bell, BellOff, Trash2, Plus, AlertTriangle, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  rateType: "official" | "blue" | "usdt";
  condition: "above" | "below";
  target: number;
  active: boolean;
  triggeredAt?: string;
}

const STORAGE_KEY = "bolivia_blu_alerts";

function loadAlerts(): Alert[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export default function AlertsPage() {
  const { t } = useLang();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [form, setForm] = useState({ rateType: "blue", condition: "above", target: "" });
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [currentRates, setCurrentRates] = useState<Record<string, number | null>>({});

  useEffect(() => {
    setAlerts(loadAlerts());
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
    // Fetch current rates to check alerts
    Promise.all([
      fetch("/api/rates?currency=USD").then((r) => r.json()),
      fetch("/api/blue-rate").then((r) => r.json()),
      fetch("/api/crypto").then((r) => r.json()),
    ]).then(([official, blue, crypto]) => {
      setCurrentRates({
        official: official.rate ?? null,
        blue:     blue.rate ?? null,
        usdt:     crypto.rates?.USDT ?? null,
      });
    }).catch(() => {});
  }, []);

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const checkAndNotify = useCallback((alertList: Alert[], rates: Record<string, number | null>) => {
    return alertList.map((a) => {
      if (!a.active) return a;
      const rate = rates[a.rateType];
      if (rate === null || rate === undefined) return a;
      const triggered = a.condition === "above" ? rate >= a.target : rate <= a.target;
      if (triggered && !a.triggeredAt) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("🇧🇴 Bolivia Blu", {
            body: `${a.rateType.toUpperCase()} rate ${a.condition === "above" ? "≥" : "≤"} ${a.target} (now: ${fmt(rate)})`,
          });
        }
        return { ...a, triggeredAt: new Date().toISOString() };
      }
      // Reset if no longer triggered
      if (!triggered && a.triggeredAt) {
        return { ...a, triggeredAt: undefined };
      }
      return a;
    });
  }, []);

  useEffect(() => {
    if (Object.keys(currentRates).length === 0) return;
    const updated = checkAndNotify(alerts, currentRates);
    if (JSON.stringify(updated) !== JSON.stringify(alerts)) {
      setAlerts(updated);
      saveAlerts(updated);
    }
  }, [currentRates, alerts, checkAndNotify]);

  const addAlert = () => {
    const target = parseFloat(form.target);
    if (!target) return;
    const newAlert: Alert = {
      id: Date.now().toString(),
      rateType: form.rateType as Alert["rateType"],
      condition: form.condition as Alert["condition"],
      target,
      active: true,
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
    setForm((f) => ({ ...f, target: "" }));
  };

  const toggleAlert = (id: string) => {
    const updated = alerts.map((a) => a.id === id ? { ...a, active: !a.active } : a);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const removeAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const rateTypeLabel: Record<string, string> = { official: "Oficial", blue: "Blue", usdt: "USDT" };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8 text-brand-600" />
          {t.alerts.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.alerts.subtitle}</p>
      </div>

      {/* Notification permission */}
      {notifPermission !== "granted" && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <CardContent className="pt-5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{t.alerts.permissionNeeded}</p>
            </div>
            <Button variant="default" size="sm" onClick={requestNotifPermission}>
              <Bell className="h-4 w-4 mr-2" />
              Activar notificaciones
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current rates */}
      <div className="grid grid-cols-3 gap-3">
        {["official", "blue", "usdt"].map((type) => (
          <div key={type} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{rateTypeLabel[type]}</p>
            <p className="font-bold">{currentRates[type] ? fmt(currentRates[type]!) : "—"}</p>
          </div>
        ))}
      </div>

      {/* Add alert form */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />{t.alerts.addAlert}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select value={form.rateType} onValueChange={(v) => setForm((f) => ({ ...f, rateType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="official">Oficial</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
              </SelectContent>
            </Select>

            <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above">{t.alerts.above}</SelectItem>
                <SelectItem value="below">{t.alerts.below}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              step="0.10"
              placeholder="9.50"
              value={form.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            />

            <Button onClick={addAlert} disabled={!form.target}>
              {t.alerts.addAlert}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
          {t.alerts.noAlerts}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const currentRate = currentRates[alert.rateType];
            const isTriggered = Boolean(alert.triggeredAt);

            return (
              <Card key={alert.id} className={isTriggered ? "border-green-400 dark:border-green-700" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {isTriggered
                        ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        : <Bell className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      }
                      <div>
                        <p className="font-medium">
                          {rateTypeLabel[alert.rateType]}{" "}
                          {alert.condition === "above" ? "≥" : "≤"}{" "}
                          <span className="text-brand-600">{fmt(alert.target)}</span>
                        </p>
                        {currentRate && (
                          <p className="text-xs text-gray-400">
                            Actual: {fmt(currentRate)} BOB/USD
                          </p>
                        )}
                      </div>
                      <Badge variant={isTriggered ? "success" : alert.active ? "default" : "outline"}>
                        {isTriggered ? t.alerts.triggered : alert.active ? t.alerts.active : "Pausada"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleAlert(alert.id)}>
                        {alert.active ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
