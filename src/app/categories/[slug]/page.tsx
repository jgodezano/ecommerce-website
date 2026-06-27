"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<{ id: string; name: string; slug: string; description: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");
  const [filterInStock, setFilterInStock] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const found = (data.categories || []).find((c: any) => c.slug === params.slug);
        if (found) {
          setCategory(found);
          fetch(`/api/products?category=${found.id}`)
            .then((r) => r.json())
            .then((pData) => setProducts(pData.products || []))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  let displayed = [...products];
  if (filterInStock) {
    displayed = displayed.filter((p) => p.stockStatus !== "out_of_stock");
  }

  switch (sortBy) {
    case "price_asc":
      displayed.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      displayed.sort((a, b) => b.price - a.price);
      break;
    case "name_asc":
      displayed.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name_desc":
      displayed.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }

  if (!loading && !category) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">Category Not Found</h1>
          <Link href="/"><button className="bg-accent-500 text-white px-6 py-2.5 rounded-lg font-medium">Go Home</button></Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-primary-400">Loading...</p></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 mb-6">
        <Link href="/" className="hover:text-accent-600">Home</Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-accent-600">Categories</Link>
        <span>/</span>
        <span className="text-primary-900 font-medium">{category!.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-primary-900 rounded-2xl p-8 lg:p-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">{category!.name}</h1>
          <p className="text-primary-300 mt-2 max-w-2xl">{category!.description}</p>
          <p className="text-primary-400 text-sm mt-2">{products.length} product(s) available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-primary-50 rounded-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-primary-700">
            <input
              type="checkbox"
              checked={filterInStock}
              onChange={(e) => setFilterInStock(e.target.checked)}
              className="rounded border-primary-300 text-accent-500 focus:ring-accent-500"
            />
            In Stock Only
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-primary-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-accent-500"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="name_desc">Name: Z-A</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-primary-500 text-lg">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
