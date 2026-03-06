import type { Metadata } from "next";
import { Cormorant, Inter } from "next/font/google";
import "./globals.css";
import { BagProvider } from "@/contexts/BagContext";

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

export const metadata: Metadata = {
  title: "Essakobea — Premium Beauty, Elevated",
  description:
    "Book professional beauty services or shop a curated wig collection. Wig making, braids, and installations — all in one place.",
  openGraph: {
    title: "Essakobea",
    description: "Premium beauty services & wig ecommerce.",
    siteName: "Essakobea",
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
        <BagProvider>{children}</BagProvider>
      </body>
    </html>
  );
}
