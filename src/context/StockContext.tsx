"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { products as defaultProducts } from "@/data/products";

interface StockItem {
  productId: string;
  sizeName: string;
  stock: number;
}

interface StockContextType {
  getStock: (productId: string, sizeName?: string) => number;
  getOriginalStock: (productId: string, sizeName?: string) => number;
  checkAvailability: (productId: string, quantity: number, sizeName?: string) => { available: boolean; currentStock: number };
  reserveStock: (productId: string, quantity: number, sizeName?: string) => boolean;
  releaseStock: (productId: string, quantity: number, sizeName?: string) => void;
  updateStock: (productId: string, newStock: number, sizeName?: string) => void;
  getLowStockItems: () => { productId: string; productName: string; sizeName: string; stock: number }[];
  getAllStock: () => StockItem[];
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const STORAGE_KEY = "bm_stock_levels";

function buildInitialStock(): StockItem[] {
  const items: StockItem[] = [];
  for (const p of defaultProducts) {
    for (const s of p.sizes) {
      items.push({ productId: p.id, sizeName: s.name, stock: s.stock });
    }
  }
  return items;
}

function loadStock(): StockItem[] {
  if (typeof window === "undefined") return buildInitialStock();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  const initial = buildInitialStock();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveStock(items: StockItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function StockProvider({ children }: { children: ReactNode }) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setStockItems(loadStock());
    setInitialized(true);
  }, []);

  const getStock = useCallback(
    (productId: string, sizeName?: string): number => {
      const item = stockItems.find(
        (s) => s.productId === productId && (!sizeName || s.sizeName === sizeName)
      );
      return item?.stock ?? 0;
    },
    [stockItems]
  );

  const getOriginalStock = useCallback(
    (productId: string, sizeName?: string): number => {
      const product = defaultProducts.find((p) => p.id === productId);
      if (!product) return 0;
      if (sizeName) {
        const size = product.sizes.find((s) => s.name === sizeName);
        return size?.stock ?? 0;
      }
      return product.sizes[0]?.stock ?? 0;
    },
    []
  );

  const checkAvailability = useCallback(
    (productId: string, quantity: number, sizeName?: string) => {
      const currentStock = getStock(productId, sizeName);
      return { available: currentStock >= quantity, currentStock };
    },
    [getStock]
  );

  const reserveStock = useCallback(
    (productId: string, quantity: number, sizeName?: string): boolean => {
      const { available, currentStock } = checkAvailability(productId, quantity, sizeName);
      if (!available) return false;
      const newItems = stockItems.map((s) =>
        s.productId === productId && (!sizeName || s.sizeName === sizeName)
          ? { ...s, stock: s.stock - quantity }
          : s
      );
      setStockItems(newItems);
      saveStock(newItems);
      return true;
    },
    [stockItems, checkAvailability]
  );

  const releaseStock = useCallback(
    (productId: string, quantity: number, sizeName?: string) => {
      const newItems = stockItems.map((s) =>
        s.productId === productId && (!sizeName || s.sizeName === sizeName)
          ? { ...s, stock: s.stock + quantity }
          : s
      );
      setStockItems(newItems);
      saveStock(newItems);
    },
    [stockItems]
  );

  const updateStock = useCallback(
    (productId: string, newStock: number, sizeName?: string) => {
      const newItems = stockItems.map((s) =>
        s.productId === productId && (!sizeName || s.sizeName === sizeName)
          ? { ...s, stock: Math.max(0, newStock) }
          : s
      );
      setStockItems(newItems);
      saveStock(newItems);
    },
    [stockItems]
  );

  const getLowStockItems = useCallback(() => {
    return stockItems
      .filter((s) => s.stock > 0 && s.stock <= 50)
      .map((s) => {
        const product = defaultProducts.find((p) => p.id === s.productId);
        return {
          productId: s.productId,
          productName: product?.name ?? "Unknown",
          sizeName: s.sizeName,
          stock: s.stock,
        };
      });
  }, [stockItems]);

  const getAllStock = useCallback(() => stockItems, [stockItems]);

  const getDefaultStock = useCallback(() => 0, []);
  const getDefaultAvailability = useCallback(() => ({ available: false, currentStock: 0 }), []);
  const getDefaultBool = useCallback(() => false, []);
  const getDefaultVoid = useCallback(() => {}, []);
  const getDefaultItems = useCallback((): { productId: string; productName: string; sizeName: string; stock: number }[] => [], []);
  const getDefaultAllStock = useCallback((): StockItem[] => [], []);

  const contextValue: StockContextType = initialized
    ? { getStock, getOriginalStock, checkAvailability, reserveStock, releaseStock, updateStock, getLowStockItems, getAllStock }
    : { getStock: getDefaultStock, getOriginalStock: getDefaultStock, checkAvailability: getDefaultAvailability, reserveStock: getDefaultBool, releaseStock: getDefaultVoid, updateStock: getDefaultVoid, getLowStockItems: getDefaultItems, getAllStock: getDefaultAllStock };

  return (
    <StockContext.Provider value={contextValue}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) throw new Error("useStock must be used within a StockProvider");
  return context;
}
