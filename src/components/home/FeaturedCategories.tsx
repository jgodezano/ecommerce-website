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

const EMOJIS = ["💎", "🔮", "📿", "🪨", "🧬"];

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories((data.categories || []).filter((c: Category) => c.featured).slice(0, 5)))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="section-padding bg-primary-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 lg:mb-14">
          <span className="text-sm font-semibold text-accent-600 uppercase tracking-wider">Categories</span>
          <h2 className="heading-2 text-primary-900 mt-2">Shop by Category</h2>
          <p className="text-primary-500 mt-3 max-w-2xl mx-auto">
            Browse our curated collection of crystals, gemstones, and mineral specimens
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[4/3] bg-primary-100 relative overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center">
                  <span className="text-6xl opacity-30">
                    {EMOJIS[index % EMOJIS.length]}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                  <p className="text-white/80 text-sm mt-1 line-clamp-2">{cat.description}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-primary-500">{cat.productCount} Products</span>
                <span className="text-sm font-semibold text-accent-600 group-hover:translate-x-1 transition-transform">
                  View Products &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
