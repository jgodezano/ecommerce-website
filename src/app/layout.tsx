import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { StockProvider } from "@/context/StockContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/cart/CartSidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Merica House of Rocks - Premium Natural Stones, Bricks & Construction Materials",
    template: "%s | Merica House of Rocks",
  },
  description:
    "Your trusted supplier of crazy cut stones, granite, pebbles, bricks, cobblestones, adobe, and Vigan tiles in Lipa City, Batangas. Premium natural stone products for construction and landscaping.",
  keywords: [
    "natural stones",
    "crazy cut stones",
    "granite",
    "pebbles",
    "bricks",
    "cobblestones",
    "adobe",
    "Vigan tiles",
    "construction materials",
    "landscaping",
    "Lipa City",
    "Batangas",
  ],
  openGraph: {
    title: "Merica House of Rocks",
    description: "Your trusted supplier of premium natural stones and construction materials in Lipa City, Batangas.",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <StockProvider>
              <CartProvider>
                <Header />
                <CartSidebar />
                <main className="flex-1">{children}</main>
                <Footer />
              </CartProvider>
            </StockProvider>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
