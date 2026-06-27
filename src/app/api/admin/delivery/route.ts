import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const zones = db.prepare("SELECT * FROM delivery_zones ORDER BY fee ASC").all();
  return NextResponse.json({ zones });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getDb();
    const id = crypto.randomUUID();

    db.prepare(
      "INSERT INTO delivery_zones (id, name, fee, min_order_for_free, estimated_days) VALUES (?, ?, ?, ?, ?)"
    ).run(id, body.name, body.fee || 0, body.minOrderForFree || null, body.estimatedDays || "");

    return NextResponse.json({ success: true, zoneId: id });
  } catch (error) {
    console.error("Create zone error:", error);
    return NextResponse.json({ error: "Failed to create zone" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { zoneId, ...fields } = body;
    if (!zoneId) return NextResponse.json({ error: "zoneId required" }, { status: 400 });

    const db = getDb();
    const updates: string[] = [];
    const params: any[] = [];

    if (fields.name !== undefined) { updates.push("name = ?"); params.push(fields.name); }
    if (fields.fee !== undefined) { updates.push("fee = ?"); params.push(fields.fee); }
    if (fields.minOrderForFree !== undefined) { updates.push("min_order_for_free = ?"); params.push(fields.minOrderForFree); }
    if (fields.estimatedDays !== undefined) { updates.push("estimated_days = ?"); params.push(fields.estimatedDays); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    params.push(zoneId);
    db.prepare(`UPDATE delivery_zones SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update zone error:", error);
    return NextResponse.json({ error: "Failed to update zone" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get("id");
    if (!zoneId) return NextResponse.json({ error: "zoneId required" }, { status: 400 });

    const db = getDb();
    db.prepare("DELETE FROM delivery_zones WHERE id = ?").run(zoneId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete zone error:", error);
    return NextResponse.json({ error: "Failed to delete zone" }, { status: 500 });
  }
}
