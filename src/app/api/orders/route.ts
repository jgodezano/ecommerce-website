import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const orders = db.prepare(
    "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC"
  ).all(session.user.id);

  return NextResponse.json({ orders });
}
