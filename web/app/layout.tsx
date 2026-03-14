import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Bolivia Blu — Tasas de Cambio en Tiempo Real",
  description: "Hub financiero para mover dinero en Bolivia. Tasas oficial, blue y cripto. Mercado P2P, calculadora de remesas y directorio de casas de cambio.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bolivia Blu",
  },
  openGraph: {
    title: "Bolivia Blu",
    description: "Tasas de cambio oficial, blue y cripto para Bolivia",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0066CC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-6">
            {children}
          </main>
          <footer className="mt-12 border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-400">
            Bolivia Blu · Tasas referenciales únicamente · No somos un servicio financiero regulado
          </footer>
        </Providers>
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`
        }} />
      </body>
    </html>
  );
}
