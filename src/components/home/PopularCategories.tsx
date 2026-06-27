"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  featured: boolean;
}

const EMOJIS = ["🧱", "🧱", "🪨", "📋", "🧱"];

export default function PopularCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories((data.categories || []).filter((c: Category) => c.featured).slice(0, 5)))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
            <p className="text-gray-500 mt-1">Shop our most popular product categories</p>
          </div>
          <Link href="/categories/hollow-blocks" className="text-sm font-semibold text-accent-500 hover:text-accent-600 transition-colors whitespace-nowrap">
            View All Categories &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-accent-200 transition-all duration-300"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                <span className="text-6xl sm:text-7xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                  {EMOJIS[i % EMOJIS.length]}
                </span>
              </div>
              <div className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 group-hover:text-accent-600 transition-colors">{cat.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{cat.productCount} Products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
