import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { StockProvider } from "@/context/StockContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { QuoteProvider } from "@/context/QuoteContext";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Merica House of Rocks - Premium Crystals, Gemstones & Fossils",
    template: "%s | Merica House of Rocks",
  },
  description:
    "Your trusted source for authentic crystals, gemstones, minerals, fossils, and crystal jewelry in Lipa City, Batangas. Quality specimens for collectors, jewelers, and crystal enthusiasts.",
  keywords: [
    "crystals",
    "gemstones",
    "minerals",
    "fossils",
    "amethyst",
    "rose quartz",
    "labradorite",
    "crystal jewelry",
    "tumbled stones",
    "geodes",
    "Lipa City",
    "Batangas",
  ],
  openGraph: {
    title: "Merica House of Rocks",
    description: "Your trusted source for authentic crystals, gemstones, minerals, and fossils in Lipa City, Batangas.",
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
        <CartProvider>
          <StockProvider>
            <QuoteProvider>
              <CustomerAuthProvider>
                <AdminAuthProvider>
                  <AppShell>{children}</AppShell>
                </AdminAuthProvider>
              </CustomerAuthProvider>
            </QuoteProvider>
          </StockProvider>
        </CartProvider>
      </body>
    </html>
  );
}
