"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import { CartItem, Cart } from "@/types";

interface CartState extends Cart {
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "SET_SHIPPING"; payload: number };

function calculateCart(items: CartItem[]): Omit<Cart, "itemCount"> {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.12;
  const shipping = 0;
  const total = subtotal + tax + shipping;
  return { items, subtotal, tax, shipping, total };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId && item.size === action.payload.size
      );
      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = [...state.items];
        const existing = newItems[existingIndex];
        const newQty = existing.quantity + action.payload.quantity;
        newItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * existing.unitPrice,
        };
      } else {
        newItems = [...state.items, action.payload];
      }
      const totals = calculateCart(newItems);
      return { ...state, ...totals, items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0) };
    }
    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload);
      const totals = calculateCart(newItems);
      return { ...state, ...totals, items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0) };
    }
    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity, totalPrice: action.payload.quantity * item.unitPrice }
          : item
      );
      const totals = calculateCart(newItems);
      return { ...state, ...totals, items: newItems, itemCount: newItems.reduce((s, i) => s + i.quantity, 0) };
    }
    case "CLEAR_CART":
      return { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0, isOpen: false };
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };
    case "SET_SHIPPING":
      return { ...state, shipping: action.payload, total: state.subtotal + state.tax + action.payload };
    default:
      return state;
  }
}

interface CartContextType {
  cart: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setShipping: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, {
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,
    isOpen: false,
  });

  const addItem = useCallback((item: CartItem) => dispatch({ type: "ADD_ITEM", payload: item }), []);
  const removeItem = useCallback((id: string) => dispatch({ type: "REMOVE_ITEM", payload: id }), []);
  const updateQuantity = useCallback((id: string, quantity: number) => dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const toggleCart = useCallback(() => dispatch({ type: "TOGGLE_CART" }), []);
  const setShipping = useCallback((fee: number) => dispatch({ type: "SET_SHIPPING", payload: fee }), []);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, toggleCart, setShipping }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
