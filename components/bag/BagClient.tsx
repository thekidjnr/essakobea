"use client";

import Image from "next/image";
import Link from "next/link";
import { useBag } from "@/contexts/BagContext";

export default function BagClient() {
  const { items, count, removeItem, updateQty, getProduct, subtotal, clearBag } = useBag();

  if (count === 0) {
    return (
      <div className="min-h-screen bg-paper pt-36 pb-24 px-6 md:px-16 flex flex-col items-center justify-center text-center">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-5">
          Your Bag
        </p>
        <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] font-light text-ink leading-none mb-6">
          Nothing here <span className="italic">yet.</span>
        </h2>
        <p className="font-sans text-[13px] text-ink/45 font-light mb-10 max-w-xs leading-relaxed">
          Browse the collection and add pieces you love.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-32 md:pt-40 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">

        {/* Header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-3">
              Your Bag
            </p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] font-light text-ink leading-none">
              {count} {count === 1 ? "piece" : <><span className="italic">pieces</span></>}
            </h1>
          </div>
          <button
            onClick={clearBag}
            className="font-sans text-[10px] tracking-widest uppercase text-ink/30 hover:text-ink transition-colors pb-2"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">

          {/* Items list */}
          <div className="flex flex-col divide-y divide-ink/[0.07]">
            {items.map((item) => {
              const product = getProduct(item.productId);
              if (!product) return null;
              return (
                <div key={item.productId} className="flex gap-5 md:gap-8 py-8 group">
                  {/* Image */}
                  <Link href={`/shop/${product.id}`} className="flex-shrink-0">
                    <div className="relative w-24 md:w-32 aspect-[3/4] overflow-hidden bg-mist">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="128px"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <p className="font-sans text-[9px] tracking-widest uppercase text-ink/35 mb-1">
                        {product.categoryLabel}
                        {product.length && ` · ${product.length}`}
                      </p>
                      <Link href={`/shop/${product.id}`}>
                        <h3 className="font-serif text-[1.2rem] font-light text-ink leading-snug hover:italic transition-all duration-300">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="font-sans text-[12px] text-ink/45 font-light mt-1 leading-snug line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-0 border border-ink/15">
                        <button
                          onClick={() => updateQty(product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center font-sans text-[14px] text-ink/40 hover:text-ink hover:bg-ink/5 transition-all"
                        >
                          −
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center font-sans text-[12px] text-ink border-x border-ink/15">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center font-sans text-[14px] text-ink/40 hover:text-ink hover:bg-ink/5 transition-all"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-5">
                        <span className="font-sans text-[13px] text-ink font-light">
                          ₵{(product.priceRaw * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="font-sans text-[10px] tracking-widest uppercase text-ink/25 hover:text-ink/60 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-28">
            <div className="bg-mist p-8">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-8">
                Order Summary
              </p>

              <div className="flex flex-col gap-4 mb-6">
                {items.map((item) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="flex items-start justify-between gap-4">
                      <span className="font-sans text-[12px] text-ink/60 font-light leading-snug">
                        {product.name}
                        {item.quantity > 1 && (
                          <span className="text-ink/35"> ×{item.quantity}</span>
                        )}
                      </span>
                      <span className="font-sans text-[12px] text-ink/70 flex-shrink-0">
                        ₵{(product.priceRaw * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-ink/10 mb-6" />

              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[11px] tracking-widest uppercase text-ink/50">
                  Subtotal
                </span>
                <span className="font-serif text-[1.5rem] font-light text-ink">
                  ₵{subtotal.toLocaleString()}
                </span>
              </div>

              <p className="font-sans text-[11px] text-ink/30 font-light mb-8 leading-relaxed">
                Delivery or pickup options available at checkout. Prices in GHS.
              </p>

              {/* Checkout CTA */}
              <button
                disabled
                className="w-full bg-ink/20 text-ink/30 font-sans text-[11px] tracking-widest uppercase py-4 cursor-not-allowed mb-3"
                title="Checkout coming soon"
              >
                Checkout — Coming Soon
              </button>

              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 font-sans text-[11px] tracking-widest uppercase text-ink/50 hover:text-ink transition-colors py-3 border border-ink/15 hover:border-ink/40"
              >
                Continue Shopping
              </Link>

              {/* Book service nudge */}
              <div className="mt-8 pt-6 border-t border-ink/10">
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-2">
                  Want it installed?
                </p>
                <p className="font-sans text-[12px] text-ink/45 font-light mb-4 leading-relaxed">
                  Book a professional installation alongside your order.
                </p>
                <Link
                  href="/book?service=installations"
                  className="font-sans text-[11px] tracking-widest uppercase text-ink flex items-center gap-2 hover:opacity-60 transition-opacity"
                >
                  Book Installation <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
