import type { Metadata, Viewport } from "next";
import { Cormorant, Inter } from "next/font/google";
import "./globals.css";
import { BagProvider } from "@/contexts/BagContext";
import TopLoader from "@/components/admin/TopLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://essakobea.com"),
  title: "Essakobea",
  description:
    "Book professional beauty services. Wig making, braids, and installations, all in one place.",
  openGraph: {
    title: "Essakobea",
    description: "Book professional beauty services in Accra, East Legon.",
    siteName: "Essakobea",
    url: "https://essakobea.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Essakobea",
    description: "Book professional beauty services in Accra, East Legon.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="antialiased">
        <TopLoader />
        <BagProvider>{children}</BagProvider>
      </body>
    </html>
  );
}
