"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products/best-sellers")
      .then((res) => res.json())
      .then((data) => setProducts((data.products || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-10 lg:py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Best Selling Products</h2>
            <p className="text-gray-500 mt-1">Most popular products trusted by contractors and homeowners</p>
          </div>
          <Link
            href="/categories/hollow-blocks"
            className="text-sm font-semibold text-accent-500 hover:text-accent-600 transition-colors whitespace-nowrap"
          >
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
