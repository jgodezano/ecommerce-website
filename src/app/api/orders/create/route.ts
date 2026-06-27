import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDb();

    const orderId = crypto.randomUUID();
    const orderNumber = `BM-${Date.now().toString(36).toUpperCase()}`;

    const { items, subtotal, tax, shipping, total, paymentMethod, deliveryMethod, shippingAddress, notes } = body;

    db.prepare(`
      INSERT INTO orders (id, order_number, customer_id, status, subtotal, tax, shipping, total, payment_method, delivery_method, shipping_address, notes)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, orderNumber, session.user.id, subtotal || 0, tax || 0, shipping || 0, total || 0, paymentMethod || "cod", deliveryMethod || "delivery", JSON.stringify(shippingAddress || {}), notes || "");

    if (items && Array.isArray(items)) {
      const insertItem = db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, product_name, size, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of items) {
        insertItem.run(crypto.randomUUID(), orderId, item.productId, item.name, item.size || "Standard", item.quantity, item.unitPrice, item.totalPrice);
      }
    }

    return NextResponse.json({ success: true, orderId, orderNumber });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
