"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBag, type Product } from "@/contexts/BagContext";

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { addItem } = useBag();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 pt-32 md:pt-40 pb-8">
        <div className="flex items-center gap-3 font-sans text-[10px] tracking-widest uppercase text-ink/35">
          <Link href="/shop" className="hover:text-ink transition-colors">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${product.category}`}
            className="hover:text-ink transition-colors"
          >
            {product.categoryLabel}
          </Link>
          <span>/</span>
          <span className="text-ink/60">{product.name}</span>
        </div>
      </div>

      {/* Main product layout */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">

          {/* Image panel */}
          <div className="sticky top-24">
            <div className="relative aspect-[3/4] overflow-hidden bg-mist">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.tag && (
                <span className="absolute top-4 left-4 font-sans text-[9px] tracking-widest uppercase text-paper bg-ink px-2.5 py-1">
                  {product.tag}
                </span>
              )}
            </div>
          </div>

          {/* Details panel */}
          <div className="pt-0 md:pt-4">
            {/* Category + type */}
            <div className="flex items-center gap-3 mb-6">
              <span className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40">
                {product.categoryLabel}
              </span>
              {product.length && (
                <>
                  <span className="text-ink/20">·</span>
                  <span className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40">
                    {product.length}
                  </span>
                </>
              )}
            </div>

            {/* Name */}
            <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-light text-ink mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <p className="font-serif text-[1.75rem] font-light text-ink mb-8">
              {product.price}
            </p>

            {/* Description */}
            <p className="font-sans text-[13px] text-ink/55 font-light leading-relaxed mb-10 max-w-sm">
              {product.description}
            </p>

            {/* Divider */}
            <div className="h-px bg-ink/10 mb-8" />

            {/* Quantity */}
            <div className="mb-6">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-3">
                Quantity
              </p>
              <div className="flex items-center gap-0 w-fit border border-ink/15">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center font-sans text-[16px] text-ink/50 hover:text-ink hover:bg-ink/5 transition-all"
                >
                  −
                </button>
                <span className="w-10 h-10 flex items-center justify-center font-sans text-[13px] text-ink border-x border-ink/15">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center font-sans text-[16px] text-ink/50 hover:text-ink hover:bg-ink/5 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to bag */}
            <button
              onClick={handleAdd}
              className={`w-full font-sans text-[11px] tracking-widest uppercase py-4 transition-all duration-300 mb-3 ${
                added
                  ? "bg-mist text-ink border border-ink/20"
                  : "bg-ink text-paper hover:bg-ink/80"
              }`}
            >
              {added ? "Added to Bag ✓" : "Add to Bag"}
            </button>

            {/* View bag link — appears after adding */}
            {added && (
              <Link
                href="/bag"
                className="flex items-center justify-center gap-2 font-sans text-[11px] tracking-widest uppercase text-ink/50 hover:text-ink transition-colors py-2"
              >
                View Bag →
              </Link>
            )}

            {/* Cross-sell — book installation */}
            {(product.category === "lace-front" ||
              product.category === "full-lace" ||
              product.category === "closure") && (
              <div className="mt-8 pt-8 border-t border-ink/10">
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">
                  Need it installed?
                </p>
                <p className="font-sans text-[12px] text-ink/50 font-light mb-4 leading-relaxed">
                  Book a professional installation at our East Legon studio and we&apos;ll have it looking second-skin.
                </p>
                <Link
                  href="/book?service=installations"
                  className="inline-flex items-center gap-2 font-sans text-[11px] tracking-widest uppercase text-ink border border-ink/20 px-5 py-3 hover:bg-ink hover:text-paper transition-all duration-300"
                >
                  Book Installation
                </Link>
              </div>
            )}

            {/* Details */}
            <div className="mt-8 pt-8 border-t border-ink/10 flex flex-col gap-3">
              {[
                ["Material", "100% Human Hair"],
                ["Care", "Wash with sulphate-free shampoo. Air dry."],
                ["Availability", "In-studio pickup or courier delivery"],
                ["Studio", "Accra, East Legon · 0557205803"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-ink/30 w-24 flex-shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="font-sans text-[12px] text-ink/55 font-light leading-relaxed">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="bg-mist py-20 md:py-28 px-6 md:px-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-end justify-between mb-12">
              <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-light text-ink">
                You may also <span className="italic">like</span>
              </h2>
              <Link
                href="/shop"
                className="font-sans text-[11px] tracking-widest uppercase text-ink/40 hover:text-ink transition-colors flex items-center gap-2"
              >
                View All <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/shop/${p.id}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-paper mb-4">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <p className="font-sans text-[9px] tracking-widest uppercase text-ink/35 mb-1">
                    {p.categoryLabel}{p.length && ` · ${p.length}`}
                  </p>
                  <h3 className="font-serif text-[1rem] font-light text-ink group-hover:italic transition-all duration-300">
                    {p.name}
                  </h3>
                  <p className="font-sans text-[12px] text-ink/50 mt-0.5">{p.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
