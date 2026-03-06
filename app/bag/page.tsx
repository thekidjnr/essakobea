import type { Metadata } from "next";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import BagClient from "@/components/bag/BagClient";

export const metadata: Metadata = {
  title: "Your Bag — Essakobea",
  description: "Review your selected items and proceed to checkout.",
};

export default function BagPage() {
  return (
    <>
      <Nav />
      <BagClient />
      <Footer />
    </>
  );
}
