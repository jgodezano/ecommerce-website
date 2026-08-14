import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function transformProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || "",
    categoryId: row.category_id || "",
    category: row.category_name || "",
    description: row.description || "",
    shortDescription: (row.description || "").slice(0, 120),
    images: safeJsonParse(row.images, []),
    specifications: safeJsonParse(row.specifications, []),
    sizes: safeJsonParse(row.sizes, []),
    weight: row.weight || "",
    materialType: row.material_type || "",
    unit: row.unit || "pc",
    price: row.price,
    wholesalePrice: row.wholesale_price || null,
    minWholesaleQty: row.min_wholesale_qty || null,
    stock: row.stock || 0,
    stockStatus: row.stock_status || "in_stock",
    featured: !!row.featured,
    bestSeller: !!row.best_seller,
    deliveryInfo: row.delivery_info || "",
    coveragePerUnit: row.coverage_per_unit == null ? null : Number(row.coverage_per_unit),
    wastagePercent: Number(row.wastage_percent || 0),
    minimumQuantity: Number(row.minimum_quantity || 1),
    estimationEnabled: row.estimation_enabled == null ? false : !!row.estimation_enabled,
    isActive: row.is_active == null ? true : !!row.is_active,
    createdAt: row.created_at || "",
    relatedProductIds: [],
  };
}

function safeJsonParse(val: any, fallback: any) {
  if (!val) return fallback;
  try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const bestSeller = searchParams.get("best_seller");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");

  const db = getDb();

  if (id || slug) {
    const field = id ? "id" : "slug";
    const val = id || slug;
    const product = db.prepare(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.${field} = ?`).get(val);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product: transformProduct(product) });
  }

  let query = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE COALESCE(p.is_active, 1) = 1";
  const params: any[] = [];

  if (category) {
    query += " AND p.category_id = ?";
    params.push(category);
  }
  if (featured === "true") {
    query += " AND p.featured = 1";
  }
  if (bestSeller === "true") {
    query += " AND p.best_seller = 1";
  }
  if (search) {
    const q = `%${search.toLowerCase()}%`;
    query += " AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?)";
    params.push(q, q);
  }

  switch (sort) {
    case "price_asc": query += " ORDER BY p.price ASC"; break;
    case "price_desc": query += " ORDER BY p.price DESC"; break;
    case "name_asc": query += " ORDER BY p.name ASC"; break;
    case "name_desc": query += " ORDER BY p.name DESC"; break;
    default: query += " ORDER BY p.created_at DESC";
  }

  const rows = db.prepare(query).all(...params);
  const products = (rows as any[]).map(transformProduct);

  return NextResponse.json({ products, total: products.length });
}
