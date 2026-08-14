import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import crypto from "crypto";

function safeJsonParse(val: any, fallback: any) {
  if (!val) return fallback;
  try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return fallback; }
}

function transformProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || "",
    categoryId: row.category_id || "",
    category: row.category_name || "",
    description: row.description || "",
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
    estimationEnabled: !!row.estimation_enabled,
    isActive: row.is_active == null ? true : !!row.is_active,
    recommendationTags: safeJsonParse(row.recommendation_tags, []),
    recommendedProjects: safeJsonParse(row.recommended_projects, []),
    usageRating: row.usage_rating || "light",
    finishStyle: row.finish_style || "",
    indoorOutdoor: row.indoor_outdoor || "both",
    drainageSuitable: row.drainage_suitable == null ? true : !!row.drainage_suitable,
    heavyLoadSuitable: !!row.heavy_load_suitable,
    colorFamily: row.color_family || "",
    createdAt: row.created_at || "",
  };
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `).all();

  const products = (rows as any[]).map(transformProduct);
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDb();
    const id = crypto.randomUUID();

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    db.prepare(`
      INSERT INTO products (id, name, slug, sku, category_id, description, images, specifications, sizes, weight, unit, price, wholesale_price, min_wholesale_qty, stock, low_stock_threshold, stock_status, featured, best_seller, material_type, delivery_info, coverage_per_unit, wastage_percent, minimum_quantity, estimation_enabled, is_active, recommendation_tags, recommended_projects, usage_rating, finish_style, indoor_outdoor, drainage_suitable, heavy_load_suitable, color_family)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, body.name, slug, body.sku || "", body.categoryId || null,
      body.description || "", JSON.stringify(body.images || []), JSON.stringify(body.specifications || []),
      JSON.stringify(body.sizes || []), body.weight || "", body.unit || "pc",
      body.price || 0, body.wholesalePrice || null, body.minWholesaleQty || null,
      body.stock || 0, body.lowStockThreshold || 50, body.stockStatus || "in_stock",
      body.featured ? 1 : 0, body.bestSeller ? 1 : 0,
      body.materialType || "", body.deliveryInfo || "",
      body.coveragePerUnit == null || body.coveragePerUnit === "" ? null : Number(body.coveragePerUnit),
      Number(body.wastagePercent || 0), Number(body.minimumQuantity || 1),
      body.estimationEnabled ? 1 : 0, body.isActive === false ? 0 : 1,
      JSON.stringify(body.recommendationTags || []), JSON.stringify(body.recommendedProjects || []),
      body.usageRating || "light", body.finishStyle || "", body.indoorOutdoor || "both",
      body.drainageSuitable === false ? 0 : 1, body.heavyLoadSuitable ? 1 : 0, body.colorFamily || ""
    );

    return NextResponse.json({ success: true, productId: id });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, ...fields } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const db = getDb();
    const allowedFields = [
      "name", "sku", "category_id", "description", "images", "specifications",
      "sizes", "weight", "unit", "price", "wholesale_price", "min_wholesale_qty",
      "stock", "low_stock_threshold", "stock_status", "featured", "best_seller",
      "material_type", "delivery_info", "coverage_per_unit", "wastage_percent",
      "minimum_quantity", "estimation_enabled", "is_active", "recommendation_tags", "recommended_projects",
      "usage_rating", "finish_style", "indoor_outdoor", "drainage_suitable", "heavy_load_suitable", "color_family",
    ];

    const updates: string[] = [];
    const params: any[] = [];
    const aliases: Record<string, string> = {
      categoryId: "category_id", wholesalePrice: "wholesale_price", minWholesaleQty: "min_wholesale_qty",
      lowStockThreshold: "low_stock_threshold", stockStatus: "stock_status", bestSeller: "best_seller",
      materialType: "material_type", deliveryInfo: "delivery_info", coveragePerUnit: "coverage_per_unit",
      wastagePercent: "wastage_percent", minimumQuantity: "minimum_quantity", estimationEnabled: "estimation_enabled",
      isActive: "is_active", recommendationTags: "recommendation_tags", recommendedProjects: "recommended_projects",
      usageRating: "usage_rating", finishStyle: "finish_style", indoorOutdoor: "indoor_outdoor",
      drainageSuitable: "drainage_suitable", heavyLoadSuitable: "heavy_load_suitable", colorFamily: "color_family",
    };

    for (const [key, rawValue] of Object.entries(fields)) {
      const dbKey = aliases[key] || key;
      if (allowedFields.includes(dbKey)) {
        let value: any = rawValue;
        if (["recommendation_tags", "recommended_projects"].includes(dbKey) && Array.isArray(value)) value = JSON.stringify(value);
        if (["featured", "best_seller", "estimation_enabled", "is_active", "drainage_suitable", "heavy_load_suitable"].includes(dbKey)) value = value ? 1 : 0;
        updates.push(`${dbKey} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    params.push(productId);
    db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const db = getDb();
    db.prepare("DELETE FROM products WHERE id = ?").run(productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
