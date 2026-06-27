"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_name: string;
  price: number;
  stock: number;
  stock_status: string;
  unit: string;
}

const STOCK_STATUS_COLORS: Record<string, string> = {
  in_stock: "text-green-600 bg-green-50",
  low_stock: "text-yellow-600 bg-yellow-50",
  out_of_stock: "text-red-600 bg-red-50",
  pre_order: "text-blue-600 bg-blue-50",
};

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStartEdit = (productId: string, currentStock: number) => {
    setEditingId(productId);
    setEditValue(currentStock);
  };

  const handleSave = async (productId: string) => {
    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          stock: editValue,
          stock_status: editValue <= 0 ? "out_of_stock" : editValue <= 50 ? "low_stock" : "in_stock",
        }),
      });
      fetchProducts();
      setEditingId(null);
    } catch {}
  };

  const lowStock = products.filter((p) => p.stock <= 50 && p.stock > 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and adjust stock levels in real-time</p>
        </div>
      </div>

      {/* Low Stock Summary */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-red-800 text-sm">{lowStock.length} product(s) running low on stock</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStock.slice(0, 5).map((item) => (
              <span key={item.id} className="px-2.5 py-1 bg-white rounded-full text-xs font-medium text-red-600 border border-red-200">
                {item.name}: {item.stock} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">SKU</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Price</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Current Stock</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-12 text-center text-gray-400" colSpan={7}>Loading inventory...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-gray-400" colSpan={7}>No products found.</td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLow = product.stock <= 50 && product.stock > 0;
                  const isOut = product.stock <= 0;

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isOut ? "bg-red-50/50" : ""}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category_name || "Uncategorized"}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{product.sku || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{product.category_name || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{formatPrice(product.price)}</td>
                      <td className="px-5 py-3 text-right">
                        {editingId === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:border-accent-500"
                              autoFocus
                            />
                            <button onClick={() => handleSave(product.id)} className="text-xs text-accent-600 font-medium hover:text-accent-700">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        ) : (
                          <span className={`font-bold ${
                            isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-600"
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_STATUS_COLORS[product.stock_status] || "text-gray-600 bg-gray-50"}`}>
                          {product.stock_status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleStartEdit(product.id, product.stock)}
                          className="px-3 py-1.5 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
