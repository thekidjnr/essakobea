import type { DbProduct } from "@/lib/supabase/types";

// Shared Product type — used by shop pages, BagContext, and ProductDetail.
// Lives here (no "use client") so server components can import it safely.
export interface Product {
  id:            string   // = slug
  name:          string
  category:      string
  categoryLabel: string
  price:         string   // formatted e.g. "₵1,200"
  priceRaw:      number   // GHS whole cedis
  length?:       string
  description:   string
  image:         string   // = image_url
  tag?:          string
  inStock:       boolean
}

export function dbToProduct(p: DbProduct): Product {
  return {
    id:            p.slug,
    name:          p.name,
    category:      p.category,
    categoryLabel: p.category_label,
    price:         `₵${p.price_raw.toLocaleString()}`,
    priceRaw:      p.price_raw,
    length:        p.length ?? undefined,
    description:   p.description,
    image:         p.image_url,
    tag:           p.tag ?? undefined,
    inStock:       p.in_stock,
  };
}
