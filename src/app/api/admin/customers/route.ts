import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const customers = db.prepare(`
    SELECT u.id, u.email, u.name, u.first_name, u.last_name, u.phone, u.role, u.created_at,
      (SELECT COUNT(*) FROM orders WHERE customer_id = u.id) as order_count,
      (SELECT COUNT(*) FROM quotes WHERE customer_id = u.id) as quote_count,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = u.id) as total_spent
    FROM users u
    WHERE u.role = 'customer'
    ORDER BY u.created_at DESC
  `).all();

  return NextResponse.json({ customers });
}
