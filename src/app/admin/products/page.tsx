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
  featured: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const STOCK_STATUS_COLORS: Record<string, string> = {
  in_stock: "text-green-600 bg-green-50",
  low_stock: "text-yellow-600 bg-yellow-50",
  out_of_stock: "text-red-600 bg-red-50",
  pre_order: "text-blue-600 bg-blue-50",
};

type FormMode = "add" | "edit" | null;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", categoryId: "", description: "", price: "", stock: "",
    stockStatus: "in_stock", unit: "pc", weight: "", materialType: "",
  });

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openAdd = () => {
    setMode("add");
    setEditId(null);
    setForm({ name: "", sku: "", categoryId: "", description: "", price: "", stock: "", stockStatus: "in_stock", unit: "pc", weight: "", materialType: "" });
  };

  const openEdit = (product: Product) => {
    setMode("edit");
    setEditId(product.id);
    setForm({
      name: product.name, sku: product.sku || "", categoryId: "",
      description: "", price: String(product.price), stock: String(product.stock),
      stockStatus: product.stock_status, unit: "pc", weight: "", materialType: "",
    });
    // Fetch full product details for edit
    fetch(`/api/products?id=${product.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setForm((prev) => ({
            ...prev,
            categoryId: data.product.category_id || "",
            description: data.product.description || "",
            unit: data.product.unit || "pc",
            weight: data.product.weight || "",
            materialType: data.product.material_type || "",
          }));
        }
      })
      .catch(() => {});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...(mode === "edit" ? { productId: editId } : {}),
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId || null,
        description: form.description,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        stockStatus: form.stockStatus,
        unit: form.unit,
        weight: form.weight,
        materialType: form.materialType,
      };

      const res = await fetch("/api/admin/products", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchProducts();
      setMode(null);
    } catch (err) {
      alert("Error saving product: " + (err instanceof Error ? err.message : "Unknown"));
    }
    setSaving(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/admin/products?id=${productId}`, { method: "DELETE" });
      fetchProducts();
    } catch {
      alert("Error deleting product");
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Product Management</h1>
          <p className="text-sm text-primary-500 mt-1">{products.length} total products</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-accent-500 text-white rounded-lg font-medium text-sm hover:bg-accent-600 transition-colors"
        >
          + Add New Product
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {mode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-primary-900 mb-4">{mode === "add" ? "Add Product" : "Edit Product"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Product Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent-500">
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Price</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent-500">
                    <option value="pc">Piece</option>
                    <option value="cu.m.">Cubic Meter</option>
                    <option value="sq.m.">Square Meter</option>
                    <option value="kg">Kilogram</option>
                    <option value="bag">Bag</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Stock Status</label>
                  <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent-500">
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="pre_order">Pre-Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Material Type</label>
                  <input value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })}
                    className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setMode(null)}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="px-4 py-2 text-sm font-medium bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50">
                {saving ? "Saving..." : mode === "add" ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Product</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">SKU</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Category</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Price</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Stock</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-primary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-primary-400" colSpan={7}>Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-primary-400" colSpan={7}>No products found</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-primary-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-200 flex items-center justify-center text-lg">
                          🧱
                        </div>
                        <div>
                          <p className="font-medium text-primary-900">{product.name}</p>
                          <p className="text-xs text-primary-400">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary-600 font-mono text-xs">{product.sku || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs">{product.category_name || "Uncategorized"}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary-900">{formatPrice(product.price)}</td>
                    <td className="px-6 py-4 text-primary-600">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_STATUS_COLORS[product.stock_status] || "text-gray-600 bg-gray-50"}`}>
                        {product.stock_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)}
                          className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 rounded-lg">Edit</button>
                        <button onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
