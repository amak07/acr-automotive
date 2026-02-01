import type { Metadata } from "next";
import { Noto_Sans, Exo_2 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/shared/layout/Footer";
import { ContactFabs } from "@/components/shared/layout/ContactFabs";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACR Automotive | Catálogo Profesional de Autopartes",
  description:
    "Catálogo profesional de mazas, baleros y juntas homocinéticas. Búsqueda por vehículo, referencias cruzadas y especificaciones técnicas.",
  keywords: [
    "mazas",
    "baleros",
    "juntas homocinéticas",
    "autopartes",
    "refacciones",
    "ACR Automotive",
    "catálogo autopartes",
    "wheel bearings",
    "hub assemblies",
    "CV joints",
  ],
  authors: [{ name: "ACR Automotive" }],
  creator: "ACR Automotive",
  publisher: "ACR Automotive",
  metadataBase: new URL("https://www.acr-automotive.com"),
  alternates: {
    canonical: "/",
    languages: {
      "es-MX": "/",
      "en-US": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    alternateLocale: "en_US",
    url: "https://www.acr-automotive.com",
    siteName: "ACR Automotive",
    title: "ACR Automotive | Catálogo Profesional de Autopartes",
    description:
      "Catálogo profesional de mazas, baleros y juntas homocinéticas. Búsqueda por vehículo y referencias cruzadas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ACR Automotive | Catálogo Profesional de Autopartes",
    description:
      "Catálogo profesional de mazas, baleros y juntas homocinéticas.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${exo2.variable} font-sans flex flex-col min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <div className="flex-1 min-h-screen bg-acr-gray-50 acr-page-bg-pattern">
            {children}
          </div>
          <Footer />
          <ContactFabs />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
