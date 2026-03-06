export type ProductCategory =
  | "all"
  | "lace-front"
  | "full-lace"
  | "closure"
  | "accessories";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: string;
  priceRaw: number;
  length?: string;
  description: string;
  image: string;
  tag?: string; // e.g. "New", "Bestseller"
  inStock: boolean;
}

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lace-front", label: "Lace Fronts" },
  { id: "full-lace", label: "Full Lace" },
  { id: "closure", label: "Closures" },
  { id: "accessories", label: "Accessories" },
];

export const PRODUCTS: Product[] = [
  // ─── Lace Fronts ─────────────────────────────────────────────────────────────
  {
    id: "obsidian-lace",
    name: "The Obsidian",
    category: "lace-front",
    categoryLabel: "Lace Front",
    price: "₵1,200",
    priceRaw: 1200,
    length: "22 inch",
    description: "Jet black, straight, silky texture. Natural hairline, pre-plucked.",
    image:
      "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    tag: "Bestseller",
    inStock: true,
  },
  {
    id: "silk-press-unit",
    name: "The Silk Press",
    category: "lace-front",
    categoryLabel: "Lace Front",
    price: "₵1,400",
    priceRaw: 1400,
    length: "26 inch",
    description: "Blown-out silk press finish. Long, voluminous, and flawless.",
    image:
      "https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    inStock: true,
  },
  {
    id: "chestnut-bob",
    name: "The Chestnut Bob",
    category: "lace-front",
    categoryLabel: "Lace Front",
    price: "₵800",
    priceRaw: 800,
    length: "10 inch",
    description: "Classic bob cut, chestnut brown. Clean lines, bold presence.",
    image:
      "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    tag: "New",
    inStock: true,
  },
  {
    id: "midnight-wave",
    name: "The Midnight Wave",
    category: "lace-front",
    categoryLabel: "Lace Front",
    price: "₵1,100",
    priceRaw: 1100,
    length: "20 inch",
    description: "Deep body wave, natural black. Movement, dimension, and depth.",
    image:
      "https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&q=85&cs=tinysrgb&w=800",
    inStock: true,
  },

  // ─── Full Lace ────────────────────────────────────────────────────────────────
  {
    id: "ginger-goddess",
    name: "The Ginger Goddess",
    category: "full-lace",
    categoryLabel: "Full Lace",
    price: "₵1,800",
    priceRaw: 1800,
    length: "24 inch",
    description: "Rich ginger auburn, full lace construction. Wear it up, wear it down — anywhere.",
    image:
      "https://images.pexels.com/photos/2876486/pexels-photo-2876486.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    tag: "New",
    inStock: true,
  },
  {
    id: "golden-hour",
    name: "The Golden Hour",
    category: "full-lace",
    categoryLabel: "Full Lace",
    price: "₵1,650",
    priceRaw: 1650,
    length: "22 inch",
    description: "Honey blonde, full lace. Catches the light exactly the way it should.",
    image:
      "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    tag: "Bestseller",
    inStock: true,
  },
  {
    id: "deep-curl-queen",
    name: "The Deep Curl",
    category: "full-lace",
    categoryLabel: "Full Lace",
    price: "₵1,900",
    priceRaw: 1900,
    length: "20 inch",
    description: "Defined deep curls, full lace. Bouncy, moisturised texture right out of the box.",
    image:
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    inStock: true,
  },

  // ─── Closures ─────────────────────────────────────────────────────────────────
  {
    id: "natural-wave",
    name: "The Natural Wave",
    category: "closure",
    categoryLabel: "Closure Unit",
    price: "₵750",
    priceRaw: 750,
    length: "16 inch",
    description: "Natural texture body wave. 4×4 closure, soft density, everyday-ready.",
    image:
      "https://images.pexels.com/photos/3765114/pexels-photo-3765114.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    inStock: true,
  },
  {
    id: "classic-straight",
    name: "The Classic",
    category: "closure",
    categoryLabel: "Closure Unit",
    price: "₵680",
    priceRaw: 680,
    length: "18 inch",
    description: "Jet black, bone straight. 5×5 closure. The everyday essential.",
    image:
      "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    tag: "Bestseller",
    inStock: true,
  },

  // ─── Accessories ─────────────────────────────────────────────────────────────
  {
    id: "edge-control-kit",
    name: "Edge Control Kit",
    category: "accessories",
    categoryLabel: "Accessories",
    price: "₵80",
    priceRaw: 80,
    description: "Long-hold edge control. No flaking, no white cast — clean finish every time.",
    image:
      "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    inStock: true,
  },
  {
    id: "wig-grip-band",
    name: "Wig Grip Band",
    category: "accessories",
    categoryLabel: "Accessories",
    price: "₵60",
    priceRaw: 60,
    description: "Velvet grip band. Keeps your unit secure all day — no glue needed.",
    image:
      "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    inStock: true,
  },
  {
    id: "lace-tint-spray",
    name: "Lace Tint Spray",
    category: "accessories",
    categoryLabel: "Accessories",
    price: "₵120",
    priceRaw: 120,
    description: "Tints transparent lace to match your skin tone in seconds.",
    image:
      "https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    tag: "New",
    inStock: true,
  },
  {
    id: "maintenance-kit",
    name: "Wig Maintenance Kit",
    category: "accessories",
    categoryLabel: "Accessories",
    price: "₵350",
    priceRaw: 350,
    description: "Everything you need to keep your unit fresh — shampoo, conditioner, detangler & stand.",
    image:
      "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    inStock: true,
  },
];
