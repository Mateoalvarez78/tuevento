import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { MyEventProvider } from "@/lib/MyEventContext";
import ConditionalNav from "@/components/ConditionalNav";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  // `metadataBase` es lo que permite que `alternates.canonical` relativo de cada
  // página resuelva a una URL absoluta sobre el dominio canónico. El apex
  // redirige a `www` con 308, así que la forma con `www` es la que se publica y
  // la única que debe aparecer en un canonical o en un sitemap.
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: {
    default: `${BRAND} — Marketplace de servicios para eventos en Uruguay`,
    // Cada página define su propio title; este sufijo lo completa.
    template: `%s · ${BRAND}`,
  },
  description:
    "Marketplace uruguayo de servicios para eventos. Pedí disponibilidad a proveedores de catering, música, fotografía, decoración y más, y contratá cada servicio por separado.",
  applicationName: BRAND,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "es_UY",
    url: CANONICAL_ORIGIN,
    title: `${BRAND} — Marketplace de servicios para eventos en Uruguay`,
    description:
      "Pedí disponibilidad a proveedores de servicios para eventos en Uruguay y contratá cada servicio por separado.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <AppProvider>
          <MyEventProvider>
            <ConditionalNav>
              <main className="flex-1">{children}</main>
            </ConditionalNav>
          </MyEventProvider>
        </AppProvider>
      </body>
    </html>
  );
}
