import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-ext-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-ext-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-ext-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-sans/latin-ext-700.css";
import "./globals.css";
import "./product.css";
import "./themes.css";
import "./theme-customization.css";
import { siteConfiguration } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfiguration().origin || "http://127.0.0.1:3140"),
  title: {
    default: `${BRAND.name} — Kendine uygun olanı keşfet`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Android, iOS ve Windows uygulamalarını keşfet, karşılaştır ve kendi uygulama düzenini oluştur.",
  applicationName: BRAND.name,
  creator: BRAND.developer,
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
