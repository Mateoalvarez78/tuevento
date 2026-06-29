import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import ConditionalNav from "@/components/ConditionalNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "TuEvento – Marketplace de Servicios para Eventos",
  description:
    "Encontrá los mejores proveedores de servicios para tu evento: catering, DJ, fotografía, decoración, animación y más.",
  keywords: "eventos, catering, DJ, fotografía, decoración, animación, cumpleaños, casamiento",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <AppProvider>
          <ConditionalNav>
            <main className="flex-1">{children}</main>
          </ConditionalNav>
        </AppProvider>
      </body>
    </html>
  );
}
