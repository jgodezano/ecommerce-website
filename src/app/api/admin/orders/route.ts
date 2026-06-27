import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = `
    SELECT o.*, u.name as customer_name, u.email as customer_email,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o JOIN users u ON o.customer_id = u.id
  `;
  const params: string[] = [];

  if (status && status !== "all") {
    query += " WHERE o.status = ?";
    params.push(status);
  }

  query += " ORDER BY o.created_at DESC";

  const orders = db.prepare(query).all(...params);
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
    }

    const validStatuses = ["pending", "processing", "ready_for_delivery", "out_for_delivery", "delivered", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, orderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
