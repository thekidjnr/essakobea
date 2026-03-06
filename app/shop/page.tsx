import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ShopClient from "@/components/shop/ShopClient";
import { adminDb } from "@/lib/supabase/admin";
import { dbToProduct } from "@/lib/products";
import type { DbProduct } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop — Essakobea",
  description:
    "Premium wigs and hair accessories. Lace fronts, full lace, closure units — curated for quality.",
};

export default async function ShopPage() {
  const { data } = await adminDb
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  const products = (data as DbProduct[] ?? []).map(dbToProduct);
  return (
    <>
      <Nav />

      {/* Page hero */}
      <section className="relative overflow-hidden">
        {/* Split layout: text left, image right */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[70vh]">
          {/* Text side */}
          <div className="flex flex-col justify-end px-6 md:px-16 pt-52 pb-16 md:pt-64 md:pb-20 bg-paper order-2 md:order-1">
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-5">
              Essakobea — The Collection
            </p>
            <h1 className="font-serif text-[clamp(3rem,7vw,7rem)] leading-[0.88] font-light text-ink mb-8">
              Wear it<br />
              <span className="italic">well.</span>
            </h1>
            <p className="font-sans text-[13px] text-ink/50 font-light max-w-xs leading-relaxed mb-10">
              Premium wigs and hair accessories — every piece selected for quality, craftsmanship, and beauty.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="#collection"
                className="inline-flex items-center gap-3 font-sans text-[11px] tracking-widest uppercase text-ink"
              >
                <span className="border-b border-ink/40 pb-px hover:border-ink transition-colors">
                  Browse Collection
                </span>
                <span>↓</span>
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative min-h-[50vw] md:min-h-auto order-1 md:order-2">
            <Image
              src="/images/shop-hero.jpg"
              alt="Essakobea Shop"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Collection anchor + client-side shop */}
      <section id="collection" className="scroll-mt-0">
        <ShopClient products={products} />
      </section>

      {/* Bottom CTA */}
      <section className="bg-mist py-24 md:py-28 px-6 md:px-16 border-t border-ink/10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: "✦",
              title: "Premium Quality",
              desc: "Every wig is sourced from high-grade human hair and inspected before it ships.",
            },
            {
              icon: "✦",
              title: "Custom Styling Available",
              desc: "Want it coloured, cut, or curled? Add a styling service when you book.",
            },
            {
              icon: "✦",
              title: "Accra-Based Studio",
              desc: "Buy online or pick up in-store at our East Legon studio. Same-day available.",
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col gap-3">
              <span className="font-sans text-[10px] text-ink/25">{item.icon}</span>
              <h3 className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">
                {item.title}
              </h3>
              <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
