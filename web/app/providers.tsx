"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useState, type ReactNode } from "react";
import { translations, type LangCode } from "@/lib/i18n";

type AnyTranslations = (typeof translations)[LangCode];

// ── Lang context ──────────────────────────────────────────────────────────────
interface LangCtx {
  lang: LangCode;
  t: AnyTranslations;
  toggle: () => void;
}

const LangContext = createContext<LangCtx>({
  lang: "es",
  t: translations.es,
  toggle: () => {},
});

export function useLang() {
  return useContext(LangContext);
}

// ── Providers ─────────────────────────────────────────────────────────────────
export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>("es");

  const toggle = () => setLang((l) => (l === "es" ? "en" : "es"));
  const t = translations[lang];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LangContext.Provider value={{ lang, t, toggle }}>
        {children}
      </LangContext.Provider>
    </ThemeProvider>
  );
}
