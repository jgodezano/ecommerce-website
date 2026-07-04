"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  featured: boolean;
}

const EMOJIS: Record<string, string> = {
  "raw-crystals": "💎",
  "polished-gemstones": "💠",
  "tumbled-stones": "🔮",
  "geodes-clusters": "🪨",
  "fossils": "🦕",
  "crystal-jewelry": "📿",
  "carvings": "🗿",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-primary-400">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">All Categories</h1>
        <p className="text-primary-500 mt-3 max-w-xl mx-auto">
          Browse our collection of crystals, gemstones, fossils, and more
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-accent-300 transition-all duration-300"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
              <span className="text-7xl sm:text-8xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                {EMOJIS[cat.slug] || "💎"}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent-600 transition-colors">
                  {cat.name}
                </h3>
                {cat.featured && (
                  <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-[10px] font-bold rounded">
                    FEATURED
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
              <p className="text-xs text-gray-400 mt-3">{cat.productCount} product(s)</p>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16">
          <p className="text-primary-500 text-lg">No categories available at the moment.</p>
        </div>
      )}
    </div>
  );
}
