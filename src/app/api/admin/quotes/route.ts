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
    SELECT q.*, u.name as customer_name, u.email as customer_email
    FROM quotes q JOIN users u ON q.customer_id = u.id
  `;
  const params: string[] = [];

  if (status && status !== "all") {
    query += " WHERE q.status = ?";
    params.push(status);
  }

  query += " ORDER BY q.created_at DESC";

  const quotes = db.prepare(query).all(...params);
  return NextResponse.json({ quotes });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { quoteId, status, adminNotes, total } = body;

    if (!quoteId || !status) {
      return NextResponse.json({ error: "quoteId and status required" }, { status: 400 });
    }

    const validStatuses = ["pending", "reviewed", "approved", "rejected", "converted"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();
    const updates: string[] = ["status = ?", "updated_at = datetime('now')"];
    const params: any[] = [status];

    if (adminNotes !== undefined) {
      updates.push("admin_notes = ?");
      params.push(adminNotes);
    }
    if (total !== undefined) {
      updates.push("total = ?");
      params.push(total);
    }

    params.push(quoteId);
    db.prepare(`UPDATE quotes SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update quote error:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
