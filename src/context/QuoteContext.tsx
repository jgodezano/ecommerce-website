"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface QuoteCartItem {
  productId: string;
  productName: string;
  slug: string;
  image: string;
  quantity: number;
  notes: string;
  price: number;
}

interface QuoteContextType {
  items: QuoteCartItem[];
  itemCount: number;
  isOpen: boolean;
  addItem: (item: QuoteCartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearItems: () => void;
  toggleQuote: () => void;
  openQuote: () => void;
  closeQuote: () => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

const STORAGE_KEY = "quote_cart_items";

function loadItems(): QuoteCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveItems(items: QuoteCartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>(loadItems);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: QuoteCartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        const updated = prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
        saveItems(updated);
        return updated;
      }
      const updated = [...prev, item];
      saveItems(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.productId !== productId);
      saveItems(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      saveItems(updated);
      return updated;
    });
  }, []);

  const updateNotes = useCallback((productId: string, notes: string) => {
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.productId === productId ? { ...i, notes } : i
      );
      saveItems(updated);
      return updated;
    });
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
    saveItems([]);
  }, []);

  const toggleQuote = useCallback(() => setIsOpen((v) => !v), []);
  const openQuote = useCallback(() => setIsOpen(true), []);
  const closeQuote = useCallback(() => setIsOpen(false), []);

  return (
    <QuoteContext.Provider
      value={{
        items,
        itemCount: items.length,
        isOpen,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearItems,
        toggleQuote,
        openQuote,
        closeQuote,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error("useQuote must be used within a QuoteProvider");
  return context;
}
