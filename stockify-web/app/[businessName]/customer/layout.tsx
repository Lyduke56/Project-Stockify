import { CartProvider } from "@/lib/customer/cart-context";
import React from "react";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
