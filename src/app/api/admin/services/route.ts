import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import crypto from "crypto";

function authorized(req: NextRequest) {
  const session = getSessionFromRequest(req);
  return session && session.user.role === "admin";
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const services = db.prepare("SELECT * FROM quote_services ORDER BY created_at DESC").all();
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.name || !["flat", "per_sqm"].includes(body.pricingModel)) {
      return NextResponse.json({ error: "Name and valid pricingModel are required" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    getDb().prepare(`
      INSERT INTO quote_services (id, name, description, pricing_model, price, unit, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(body.name).trim(),
      body.description || "",
      body.pricingModel,
      Math.max(0, Number(body.price || 0)),
      body.unit || (body.pricingModel === "per_sqm" ? "m²" : "service"),
      body.active === false ? 0 : 1,
    );
    return NextResponse.json({ success: true, serviceId: id });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });
    const allowed: Record<string, string> = {
      name: "name",
      description: "description",
      pricingModel: "pricing_model",
      price: "price",
      unit: "unit",
      active: "active",
    };
    const updates: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (!allowed[key]) continue;
      updates.push(`${allowed[key]} = ?`);
      params.push(key === "price" ? Math.max(0, Number(value)) : key === "active" ? (value ? 1 : 0) : value);
    }
    if (!updates.length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    params.push(body.serviceId);
    getDb().prepare(`UPDATE quote_services SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  getDb().prepare("DELETE FROM quote_services WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
