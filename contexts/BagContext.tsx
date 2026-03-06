"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PRODUCTS, type Product } from "@/components/shop/shopData";

export interface BagItem {
  productId: string;
  quantity: number;
}

interface BagContextValue {
  items: BagItem[];
  count: number;
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearBag: () => void;
  getProduct: (productId: string) => Product | undefined;
  subtotal: number;
}

const BagContext = createContext<BagContextValue | null>(null);

const STORAGE_KEY = "essakobea_bag";

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

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
    (productId: string) => PRODUCTS.find((p) => p.id === productId),
    []
  );

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    const product = getProduct(i.productId);
    return sum + (product?.priceRaw ?? 0) * i.quantity;
  }, 0);

  return (
    <BagContext.Provider
      value={{ items, count, addItem, removeItem, updateQty, clearBag, getProduct, subtotal }}
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
