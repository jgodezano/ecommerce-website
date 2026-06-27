import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const quotes = db.prepare(
    "SELECT * FROM quotes WHERE customer_id = ? ORDER BY created_at DESC"
  ).all(session.user.id);

  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDb();

    const quoteId = crypto.randomUUID();
    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;

    const {
      items, notes, projectDetails,
      firstName, lastName, company,
      deliveryCity, timeline,
    } = body;

    db.prepare(`
      INSERT INTO quotes (id, quote_number, customer_id, status, items, notes, project_details, total)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(
      quoteId, quoteNumber, session.user.id,
      JSON.stringify(items || []),
      notes || "",
      JSON.stringify({
        firstName: firstName || "",
        lastName: lastName || "",
        company: company || "",
        deliveryCity: deliveryCity || "",
        timeline: timeline || "",
        ...(projectDetails || {}),
      }),
      0
    );

    return NextResponse.json({ success: true, quoteId, quoteNumber });
  } catch (error) {
    console.error("Create quote error:", error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
