"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/app/providers";
import { Send, Check } from "lucide-react";

interface Props {
  onSubmitted?: (rate: number) => void;
}

export function BlueRateSubmit({ onSubmitted }: Props) {
  const { t } = useLang();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async () => {
    const rate = parseFloat(value);
    if (!rate || rate < 5 || rate > 30) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/blue-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      });
      if (res.ok) {
        setStatus("done");
        onSubmitted?.(rate);
        setTimeout(() => { setStatus("idle"); setValue(""); }, 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.10"
        min={5}
        max={30}
        placeholder="Ej: 9.20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-32"
        disabled={status === "loading" || status === "done"}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={submit}
        disabled={!value || status === "loading" || status === "done"}
      >
        {status === "done" ? (
          <><Check className="h-3.5 w-3.5 mr-1 text-green-600" />{t.rates.blueSubmitted.slice(0, 10)}</>
        ) : (
          <><Send className="h-3.5 w-3.5 mr-1" />{t.rates.submitBlue}</>
        )}
      </Button>
    </div>
  );
}
