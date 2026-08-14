import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function transformService(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    pricingModel: row.pricing_model,
    price: Number(row.price || 0),
    unit: row.unit || "service",
  };
}

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM quote_services WHERE active = 1 ORDER BY name ASC").all();
  return NextResponse.json({ services: (rows as any[]).map(transformService) });
}
