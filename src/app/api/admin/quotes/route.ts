import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { calculateQuoteTotals } from "@/lib/estimator";
import crypto from "crypto";

const WORKFLOW_STATUSES = [
  "draft",
  "pending_review",
  "quoted",
  "approved",
  "rejected",
  "converted_to_order",
  "completed",
  "cancelled",
] as const;

type WorkflowStatus = typeof WORKFLOW_STATUSES[number];

function legacyStatus(status: WorkflowStatus) {
  if (status === "draft" || status === "pending_review") return "pending";
  if (status === "quoted") return "quoted";
  if (status === "approved" || status === "converted_to_order" || status === "completed") return "accepted";
  return "rejected";
}

function safeJson(value: any, fallback: any) {
  if (!value) return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return fallback; }
}

function authorized(req: NextRequest) {
  const session = getSessionFromRequest(req);
  return session && session.user.role === "admin";
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const clauses: string[] = [];
  const params: string[] = [];

  if (status && status !== "all") {
    clauses.push("COALESCE(q.workflow_status, q.status) = ?");
    params.push(status);
  }
  if (search) {
    clauses.push("(LOWER(COALESCE(q.quote_number, '')) LIKE ? OR LOWER(COALESCE(u.name, '')) LIKE ? OR LOWER(COALESCE(u.email, '')) LIKE ?)");
    const pattern = `%${search.toLowerCase()}%`;
    params.push(pattern, pattern, pattern);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const quotes = db.prepare(`
    SELECT q.*, u.name AS account_name, u.email AS account_email, u.phone AS account_phone
    FROM quotes q JOIN users u ON q.customer_id = u.id
    ${where}
    ORDER BY q.created_at DESC
  `).all(...params).map((quote: any) => ({
    ...quote,
    items: safeJson(quote.items, []),
    services: safeJson(quote.services, []),
    projectDetails: safeJson(quote.project_details, {}),
    workflow_status: quote.workflow_status || quote.status,
    display_customer_name: quote.customer_name || quote.account_name,
    display_customer_email: quote.customer_email || quote.account_email,
  }));

  return NextResponse.json({ quotes, statuses: WORKFLOW_STATUSES });
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.quoteId) return NextResponse.json({ error: "quoteId required" }, { status: 400 });

    const db = getDb();
    const existing: any = db.prepare("SELECT * FROM quotes WHERE id = ?").get(body.quoteId);
    if (!existing) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const nextWorkflowStatus = (body.workflowStatus || existing.workflow_status || existing.status) as WorkflowStatus;
    if (!WORKFLOW_STATUSES.includes(nextWorkflowStatus)) {
      return NextResponse.json({ error: "Invalid workflow status" }, { status: 400 });
    }

    const currentItems = body.items !== undefined ? body.items : safeJson(existing.items, []);
    const currentServices = body.services !== undefined ? body.services : safeJson(existing.services, []);
    const materialTotal = body.materialTotal !== undefined ? Number(body.materialTotal) : Number(existing.material_total || 0);
    const deliveryFee = body.deliveryFee !== undefined ? Number(body.deliveryFee) : Number(existing.delivery_fee || 0);
    const serviceTotal = body.serviceTotal !== undefined ? Number(body.serviceTotal) : Number(existing.service_total || 0);
    const otherCharges = body.otherCharges !== undefined ? Number(body.otherCharges) : Number(existing.other_charges || 0);
    const discount = body.discount !== undefined ? Number(body.discount) : Number(existing.discount || 0);
    const totals = calculateQuoteTotals({ materialTotal, deliveryFee, serviceTotal, otherCharges, discount });

    const updates: string[] = ["status = ?", "workflow_status = ?", "updated_at = datetime('now')", "total = ?", "material_total = ?", "delivery_fee = ?", "service_total = ?", "other_charges = ?", "discount = ?", "items = ?", "services = ?"];
    const params: any[] = [legacyStatus(nextWorkflowStatus), nextWorkflowStatus, totals.total, totals.materialTotal, totals.deliveryFee, totals.serviceTotal, totals.otherCharges, totals.discount, JSON.stringify(currentItems), JSON.stringify(currentServices)];

    const optional: Record<string, [string, any]> = {
      adminNotes: ["admin_notes", body.adminNotes],
      areaSqm: ["area_sqm", body.areaSqm == null ? null : Number(body.areaSqm)],
      selectedMaterialId: ["selected_material_id", body.selectedMaterialId],
      customerName: ["customer_name", body.customerName],
      customerEmail: ["customer_email", body.customerEmail],
      customerPhone: ["customer_phone", body.customerPhone],
      projectLocation: ["project_location", body.projectLocation],
      timeline: ["timeline", body.timeline],
      estimateDisclaimer: ["estimate_disclaimer", body.estimateDisclaimer],
    };
    for (const [key, [column, value]] of Object.entries(optional)) {
      if (body[key] !== undefined) {
        updates.push(`${column} = ?`);
        params.push(value ?? "");
      }
    }

    params.push(body.quoteId);
    db.prepare(`UPDATE quotes SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    if (body.action === "convert_to_order") {
      const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(body.quoteId) as any;
      const orderId = crypto.randomUUID();
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const orderItems = safeJson(quote.items, []);
      const createOrder = db.transaction(() => {
        db.prepare(`INSERT INTO orders (id, order_number, customer_id, status, subtotal, shipping, total, payment_method, payment_status, delivery_method, shipping_address, notes) VALUES (?, ?, ?, 'pending', ?, ?, ?, 'cod', 'pending', 'delivery', ?, ?)`)
          .run(orderId, orderNumber, quote.customer_id, quote.material_total || quote.total, quote.delivery_fee || 0, quote.total, JSON.stringify({ city: quote.project_location || "" }), `Converted from quotation ${quote.quote_number}`);
        const insertItem = db.prepare("INSERT INTO order_items (id, order_id, product_id, product_name, size, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const item of orderItems) {
          insertItem.run(crypto.randomUUID(), orderId, item.productId || "", item.name || "Material", item.size || item.unit || "", Math.max(1, Number(item.quantity || 1)), Number(item.estimatedUnitPrice || item.unitPrice || 0), Number(item.totalPrice || 0));
        }
        db.prepare("UPDATE quotes SET workflow_status = 'converted_to_order', status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(body.quoteId);
      });
      createOrder();
      return NextResponse.json({ success: true, orderId, orderNumber, totals });
    }

    return NextResponse.json({ success: true, totals, workflowStatus: nextWorkflowStatus });
  } catch (error) {
    console.error("Update quote error:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
