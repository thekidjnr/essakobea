import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/admin";
import { dbToProduct } from "@/lib/products";
import type { DbProduct } from "@/lib/supabase/types";

export default async function Collection() {
  const { data } = await adminDb
    .from("products")
    .select("*")
    .eq("tag", "Best Seller")
    .eq("in_stock", true)
    .order("display_order", { ascending: true })
    .limit(4);

  const products = (data as DbProduct[] ?? []).map(dbToProduct);

  if (products.length === 0) return null;

  return (
    <section id="collection" className="bg-mist py-28 md:py-36">
      <div className="px-6 md:px-16 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
              Top Picks
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
              Featured <span className="italic">Collection</span>
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 font-sans text-[11px] tracking-widest uppercase text-ink self-end md:self-auto"
          >
            <span className="border-b border-ink/40 pb-px hover:border-ink transition-colors">
              View All Pieces
            </span>
            <span>→</span>
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Tall item — spans 2 rows */}
          <Link href={`/shop/${products[0].id}`} className="col-span-1 md:row-span-2 group">
            <div className="relative overflow-hidden bg-stone/10 aspect-[3/4] md:aspect-auto md:h-full">
              <Image
                src={products[0].image}
                alt={products[0].name}
                fill
                priority
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span className="font-sans text-[11px] tracking-widest uppercase text-paper bg-ink px-3 py-1.5">
                  View
                </span>
              </div>
            </div>
            <ProductInfo product={products[0]} />
          </Link>

          {/* Regular items */}
          {products.slice(1).map((product) => (
            <Link key={product.id} href={`/shop/${product.id}`} className="col-span-1 group">
              <div className="relative overflow-hidden bg-stone/10 aspect-[3/4]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <span className="font-sans text-[11px] tracking-widest uppercase text-paper bg-ink px-3 py-1.5">
                    View
                  </span>
                </div>
              </div>
              <ProductInfo product={product} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductInfo({
  product,
}: {
  product: { name: string; categoryLabel: string; price: string };
}) {
  return (
    <div className="pt-4 flex items-start justify-between">
      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-ink/40 mb-1">
          {product.categoryLabel}
        </p>
        <h3 className="font-serif text-[1.1rem] font-light text-ink leading-snug">
          {product.name}
        </h3>
      </div>
      <span className="font-sans text-[13px] text-ink/60 font-light pt-5">
        {product.price}
      </span>
    </div>
  );
}
