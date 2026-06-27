import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function safeJsonParse(val: any, fallback: any) {
  if (!val) return fallback;
  try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return fallback; }
}

function transformProduct(row: any) {
  return {
    id: row.id, name: row.name, slug: row.slug, sku: row.sku || "",
    categoryId: row.category_id || "", category: "",
    description: row.description || "", shortDescription: (row.description || "").slice(0, 120),
    images: safeJsonParse(row.images, []), specifications: safeJsonParse(row.specifications, []),
    sizes: safeJsonParse(row.sizes, []), weight: row.weight || "",
    materialType: row.material_type || "", unit: row.unit || "pc", price: row.price,
    wholesalePrice: row.wholesale_price || null, minWholesaleQty: row.min_wholesale_qty || null,
    stock: row.stock || 0, stockStatus: row.stock_status || "in_stock",
    featured: !!row.featured, bestSeller: !!row.best_seller,
    deliveryInfo: row.delivery_info || "", createdAt: row.created_at || "",
    relatedProductIds: [],
  };
}

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC").all();
  const products = (rows as any[]).map(transformProduct);
  return NextResponse.json({ products });
}
