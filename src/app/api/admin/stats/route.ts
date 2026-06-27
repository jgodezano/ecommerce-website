import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const productCount = (db.prepare("SELECT COUNT(*) as count FROM products").get() as any).count;
  const activeOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('delivered','completed','cancelled')").get() as any).count;
  const pendingQuotes = (db.prepare("SELECT COUNT(*) as count FROM quotes WHERE status = 'pending'").get() as any).count;
  const revenue = (db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status IN ('delivered','completed')").get() as any).total;

  return NextResponse.json({
    stats: {
      productCount,
      activeOrders,
      pendingQuotes,
      revenue,
    },
  });
}
