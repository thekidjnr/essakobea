"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useBag } from "@/contexts/BagContext";
import type { Product } from "@/contexts/BagContext";

interface Category { id: string; label: string; }

export default function ShopClient({ products }: { products: Product[] }) {
  const { addItem, count: bagCount } = useBag();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [addedId, setAddedId] = useState<string | null>(null);

  // Derive categories from product data
  const categories: Category[] = [
    { id: "all", label: "All" },
    ...Array.from(
      new Map(products.map((p) => [p.category, p.categoryLabel])).entries()
    ).map(([id, label]) => ({ id, label })),
  ];

  // Derive tags that are actually in use
  const tags = Array.from(new Set(products.map((p) => p.tag).filter(Boolean))) as string[];

  const filtered = products
    .filter((p) => activeCategory === "all" || p.category === activeCategory)
    .filter((p) => activeTag === "all" || p.tag === activeTag);

  const handleAdd = (product: Product) => {
    addItem(product.id);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-[57px] z-30 bg-paper border-b border-ink/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          {/* Category tabs + bag */}
          <div className="flex items-center justify-between">
            <div className="flex items-stretch overflow-x-auto hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 px-5 py-4 font-sans text-[11px] tracking-widest uppercase border-b-2 transition-all duration-300 ${
                    activeCategory === cat.id
                      ? "border-ink text-ink font-medium"
                      : "border-transparent text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <Link
              href="/bag"
              className="flex items-center gap-2 font-sans text-[11px] tracking-widest uppercase text-ink flex-shrink-0 pl-4 hover:opacity-60 transition-opacity"
            >
              Bag
              {bagCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-ink text-paper text-[10px] flex items-center justify-center">
                  {bagCount}
                </span>
              )}
            </Link>
          </div>

          {/* Tag pills — only shown when tags exist */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 py-2.5 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTag("all")}
                className={`flex-shrink-0 px-3 py-1 font-sans text-[9px] tracking-widest uppercase border transition-all duration-200 ${
                  activeTag === "all" ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/45 hover:border-ink/50 hover:text-ink"
                }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? "all" : tag)}
                  className={`flex-shrink-0 px-3 py-1 font-sans text-[9px] tracking-widest uppercase border transition-all duration-200 ${
                    activeTag === tag ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/45 hover:border-ink/50 hover:text-ink"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product count */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 pt-10 pb-6">
        <p className="font-sans text-[11px] tracking-widest uppercase text-ink/35">
          {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {/* Product grid */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 pb-28">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
          {filtered.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAdd}
              added={addedId === product.id}
              priority={i < 4}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-32 text-center">
            <p className="font-serif text-[1.5rem] font-light text-ink/30 italic">
              Nothing here yet.
            </p>
          </div>
        )}
      </div>

      {/* Editorial banner */}
      {activeCategory === "all" && (
        <div className="bg-ink py-20 md:py-24 px-6 md:px-16">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-paper/30 mb-4">
                Need help choosing?
              </p>
              <h3 className="font-serif text-[clamp(2rem,4vw,4rem)] font-light text-paper leading-none">
                Book a <span className="italic">consultation.</span>
              </h3>
            </div>
            <p className="font-sans text-[13px] text-paper/40 font-light max-w-xs leading-relaxed">
              Not sure which unit is right for you? Book a free consultation and we&apos;ll help you find the perfect match.
            </p>
            <Link
              href="/book"
              className="inline-block border border-paper/40 text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-paper hover:text-ink transition-all duration-300 flex-shrink-0 self-end md:self-auto"
            >
              Book Now →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAdd,
  added,
  priority,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  added: boolean;
  priority?: boolean;
}) {
  return (
    <div className="group">
      <Link href={`/shop/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-mist mb-4">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.tag && (
            <span className="absolute top-3 left-3 font-sans text-[9px] tracking-widest uppercase text-paper bg-ink px-2.5 py-1">
              {product.tag}
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-paper/60 flex items-center justify-center">
              <span className="font-sans text-[10px] tracking-widest uppercase text-ink/50">Sold Out</span>
            </div>
          )}
          {product.inStock && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onAdd(product);
                }}
                className={`w-full font-sans text-[10px] tracking-widest uppercase py-3.5 transition-all duration-200 ${
                  added ? "bg-paper text-ink" : "bg-ink text-paper hover:bg-ink/90"
                }`}
              >
                {added ? "Added ✓" : "Add to Bag"}
              </button>
            </div>
          )}
        </div>
      </Link>

      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-sans text-[9px] tracking-widest uppercase text-ink/35 mb-1">
              {product.categoryLabel}
              {product.length && ` · ${product.length}`}
            </p>
            <Link href={`/shop/${product.id}`}>
              <h3 className="font-serif text-[1rem] font-light text-ink leading-snug group-hover:italic transition-all duration-300">
                {product.name}
              </h3>
            </Link>
          </div>
          <span className="font-sans text-[12px] text-ink/65 font-light flex-shrink-0 pt-4">
            {product.price}
          </span>
        </div>
        <p className="font-sans text-[11px] text-ink/40 font-light mt-1.5 leading-relaxed line-clamp-2">
          {product.description}
        </p>
      </div>
    </div>
  );
}
