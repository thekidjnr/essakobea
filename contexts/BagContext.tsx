"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { DbProduct } from "@/lib/supabase/types";
import { dbToProduct, type Product } from "@/lib/products";
export type { Product };
export { dbToProduct };

export interface BagItem {
  productId: string;
  quantity:  number;
}

interface BagContextValue {
  items:      BagItem[];
  count:      number;
  addItem:    (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty:  (productId: string, qty: number) => void;
  clearBag:   () => void;
  getProduct: (productId: string) => Product | undefined;
  subtotal:   number;
  products:   Product[];
}

const BagContext = createContext<BagContextValue | null>(null);
const STORAGE_KEY = "essakobea_bag";

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems]       = useState<BagItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Hydrate bag from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist bag to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // Fetch product catalogue from API once on mount
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: DbProduct[]) => {
        if (Array.isArray(data)) setProducts(data.map(dbToProduct));
      })
      .catch(() => {});
  }, []);

  const addItem = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearBag = useCallback(() => setItems([]), []);

  const getProduct = useCallback(
    (productId: string) => products.find((p) => p.id === productId),
    [products]
  );

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    const product = products.find((p) => p.id === i.productId);
    return sum + (product?.priceRaw ?? 0) * i.quantity;
  }, 0);

  return (
    <BagContext.Provider
      value={{ items, count, addItem, removeItem, updateQty, clearBag, getProduct, subtotal, products }}
    >
      {children}
    </BagContext.Provider>
  );
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside BagProvider");
  return ctx;
}
