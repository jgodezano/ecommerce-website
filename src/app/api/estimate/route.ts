import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateQuoteTotals, calculateServiceCost, estimateMaterialForArea } from "@/lib/estimator";

function json(value: any, fallback: any) {
  if (!value) return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return fallback; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const areaSqm = Number(body.areaSqm);
    if (!Number.isFinite(areaSqm) || areaSqm <= 0 || areaSqm > 1_000_000) {
      return NextResponse.json({ error: "Enter a valid area in square meters" }, { status: 400 });
    }

    const db = getDb();
    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const params: any[] = [];
    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE COALESCE(p.is_active, 1) = 1 AND COALESCE(p.estimation_enabled, 0) = 1
        AND p.coverage_per_unit IS NOT NULL AND p.coverage_per_unit > 0
    `;
    if (categoryId) {
      query += " AND p.category_id = ?";
      params.push(categoryId);
    }
    query += " ORDER BY p.best_seller DESC, p.name ASC";

    const products = (db.prepare(query).all(...params) as any[]).map((row) => {
      const material = {
        id: row.id,
        name: row.name,
        description: row.description || "",
        image: json(row.images, [])[0] || "",
        unit: row.unit || "unit",
        price: Number(row.price || 0),
        coveragePerUnit: Number(row.coverage_per_unit),
        wastagePercent: Number(row.wastage_percent || 0),
        minimumQuantity: Number(row.minimum_quantity || 1),
        estimationEnabled: !!row.estimation_enabled,
      };
      const estimate = estimateMaterialForArea(areaSqm, material);
      return estimate ? { ...material, estimate } : null;
    }).filter(Boolean);

    const serviceIds = Array.isArray(body.serviceIds) ? body.serviceIds.map(String) : [];
    let services: any[] = [];
    if (serviceIds.length) {
      const placeholders = serviceIds.map(() => "?").join(",");
      const rows = db.prepare(`SELECT * FROM quote_services WHERE active = 1 AND id IN (${placeholders})`).all(...serviceIds) as any[];
      services = rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || "",
        pricingModel: row.pricing_model,
        price: Number(row.price || 0),
        unit: row.unit || "service",
        total: calculateServiceCost({ id: row.id, name: row.name, pricingModel: row.pricing_model, price: row.price, unit: row.unit }, areaSqm),
      }));
    }

    const selected = products.find((item: any) => item.id === body.selectedProductId) || products[0] || null;
    const zone = body.deliveryZoneId ? db.prepare("SELECT * FROM delivery_zones WHERE id = ?").get(String(body.deliveryZoneId)) as any : null;
    const preliminaryMaterialTotal = selected?.estimate.materialTotal || 0;
    const configuredDeliveryFee = zone ? (zone.min_order_for_free && preliminaryMaterialTotal >= Number(zone.min_order_for_free) ? 0 : Number(zone.fee || 0)) : Number(body.deliveryFee || 0);
    const totals = calculateQuoteTotals({
      materialTotal: preliminaryMaterialTotal,
      deliveryFee: configuredDeliveryFee,
      serviceTotal: services.reduce((sum, service) => sum + service.total, 0),
      otherCharges: Number(body.otherCharges || 0),
      discount: Number(body.discount || 0),
    });

    return NextResponse.json({ areaSqm, recommendations: products, services, selectedProductId: selected?.id || null, deliveryZone: zone ? { id: zone.id, name: zone.name, fee: Number(zone.fee || 0), minOrderForFree: Number(zone.min_order_for_free || 0), estimatedDays: zone.estimated_days || "" } : null, totals });
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json({ error: "Unable to calculate estimate" }, { status: 500 });
  }
}
