import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import crypto from "crypto";

function safeJson(value: any, fallback: any) {
  if (!value) return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const quotes = (db.prepare("SELECT * FROM quotes WHERE customer_id = ? ORDER BY created_at DESC").all(session.user.id) as any[]).map((quote) => ({
    ...quote,
    items: safeJson(quote.items, []),
    services: safeJson(quote.services, []),
    projectDetails: safeJson(quote.project_details, {}),
    workflowStatus: quote.workflow_status || quote.status,
  }));
  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Please sign in before requesting a quotation" }, { status: 401 });

  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: "At least one material is required" }, { status: 400 });

    const db = getDb();
    const quoteId = crypto.randomUUID();
    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
    const areaSqm = body.areaSqm == null ? null : Number(body.areaSqm);
    const materialTotal = Number(body.materialTotal || items.reduce((sum: number, item: any) => sum + Number(item.totalPrice || 0), 0));
    const deliveryFee = Number(body.deliveryFee || 0);
    const serviceTotal = Number(body.serviceTotal || 0);
    const otherCharges = Number(body.otherCharges || 0);
    const discount = Number(body.discount || 0);
    const total = Math.max(0, materialTotal + deliveryFee + serviceTotal + otherCharges - discount);

    db.prepare(`
      INSERT INTO quotes (
        id, quote_number, customer_id, status, workflow_status, items, notes, project_details, admin_notes, total,
        area_sqm, selected_material_id, material_total, delivery_fee, service_total, other_charges, discount, services,
        customer_name, customer_email, customer_phone, project_location, timeline, estimate_disclaimer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      quoteId, quoteNumber, session.user.id, "pending", "pending_review",
      JSON.stringify(items), body.notes || "", JSON.stringify({ projectType: body.projectType || "", deliveryCity: body.deliveryCity || "", timeline: body.timeline || "", ...(body.projectDetails || {}) }), "", total,
      areaSqm, body.selectedMaterialId || null, materialTotal, deliveryFee, serviceTotal, otherCharges, discount, JSON.stringify(body.services || []),
      body.customerName || [session.user.first_name, session.user.last_name].filter(Boolean).join(" "), body.customerEmail || session.user.email, body.customerPhone || session.user.phone || "", body.projectLocation || body.deliveryCity || "", body.timeline || "", body.estimateDisclaimer || "",
    );

    return NextResponse.json({ success: true, quoteId, quoteNumber, total });
  } catch (error) {
    console.error("Create quote error:", error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
