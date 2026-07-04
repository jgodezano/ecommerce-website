"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useQuote } from "@/context/QuoteContext";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated: isCustomerAuth } = useCustomerAuth();
  const { addItem, toggleQuote } = useQuote();
  const router = useRouter();
  const selectedSize = product.sizes[0];
  const stockStatus = (product.stock || 0) <= 0 ? "out_of_stock" : (product.stock || 0) <= 50 ? "low_stock" : "in_stock";

  const handleAddToQuote = () => {
    if (!isCustomerAuth) {
      router.push(`/login?redirect=/quote?product=${product.slug}`);
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: product.images?.[0] || "",
      quantity: 1,
      notes: "",
      price: product.price,
    });
    toggleQuote();
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20 group-hover:scale-110 transition-transform duration-500">💎</span>
          </div>
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.bestSeller && (
              <span className="px-2 py-0.5 bg-accent-500 text-white text-[10px] font-bold rounded">BEST SELLER</span>
            )}
            {stockStatus === "low_stock" && (
              <span className="px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded">LOW STOCK</span>
            )}
            {stockStatus === "out_of_stock" && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">SOLD OUT</span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/categories/${product.categoryId}`}>
          <span className="text-[11px] font-semibold text-accent-600 uppercase tracking-wider">{product.category}</span>
        </Link>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2 group-hover:text-accent-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{selectedSize?.dimensions}</p>

        <div className="flex items-center justify-between mt-2">
          <p className="text-base font-bold text-accent-600">{formatPrice(product.price)}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            stockStatus === "in_stock" ? "text-green-600 bg-green-50" :
            stockStatus === "low_stock" ? "text-yellow-600 bg-yellow-50" :
            "text-red-600 bg-red-50"
          }`}>
            {stockStatus === "in_stock" ? "In Stock" : stockStatus === "low_stock" ? `${product.stock} left` : "Sold Out"}
          </span>
        </div>

        {product.wholesalePrice && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            Bulk: {formatPrice(product.wholesalePrice)} (min. {product.minWholesaleQty})
          </p>
        )}

        <div className="mt-3">
          <button
            onClick={handleAddToQuote}
            disabled={stockStatus === "out_of_stock"}
            className="w-full px-3 py-2 bg-accent-500 text-white text-xs font-semibold rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stockStatus === "out_of_stock" ? "Out of Stock" : "Add to Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
