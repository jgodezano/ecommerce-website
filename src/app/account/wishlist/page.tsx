"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function WishlistPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">My Wishlist</h1>
      <div className="bg-white border border-primary-100 rounded-xl p-12 text-center">
        <p className="text-primary-400">Your wishlist is empty.</p>
        <Link href="/categories/hollow-blocks" className="mt-4 inline-block text-accent-600 text-sm font-medium hover:text-accent-700">Browse Products &rarr;</Link>
      </div>
    </div>
  );
}
