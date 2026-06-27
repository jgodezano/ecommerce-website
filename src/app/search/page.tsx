"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim();
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setResults(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">
          Search Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-primary-500 mt-2">{loading ? "Searching..." : `${results.length} product(s) found`}</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-primary-400">Searching...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-primary-500 text-lg">No products found matching your search.</p>
          <p className="text-primary-400 text-sm mt-2">Try different keywords or browse our categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><p className="text-primary-500">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
