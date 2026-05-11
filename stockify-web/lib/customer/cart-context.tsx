"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItemType = "fnb_single" | "fnb_size" | "nfb_single" | "nfb_variant";

export interface CartItem {
  id: string; // A unique UUID for the cart item (since same product might be added with different options)
  product_id: string;
  tenant_id: string;
  item_type: CartItemType;
  name: string;
  price: number;
  qty: number;
  image?: string;
  
  // Specific tracking
  size_label?: string | null;
  option_id?: string | null;
  modifiers?: string[]; // for UI display
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem("stockify_cart");
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart from local storage", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("stockify_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (item: Omit<CartItem, "id">) => {
    setCartItems((prev) => {
      // Check if identical item already exists
      const existingIdx = prev.findIndex(
        (i) => i.product_id === item.product_id && 
               i.item_type === item.item_type && 
               i.size_label === item.size_label &&
               i.option_id === item.option_id
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].qty += item.qty;
        return updated;
      }

      const newItem = { ...item, id: crypto.randomUUID() };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
