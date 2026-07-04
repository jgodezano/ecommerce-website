import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, updateAccountStatus } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const customers = db.prepare(
    `SELECT id, email, username, name, first_name, last_name, phone, company_name,
            account_status, identity_document, rejection_reason, created_at
     FROM users WHERE role = 'customer'
     ORDER BY created_at DESC`
  ).all();
  return NextResponse.json({ customers });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, status, reason } = await req.json();
    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status are required" }, { status: 400 });
    }

    const validStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    updateAccountStatus(userId, status, reason || "");

    return NextResponse.json({
      success: true,
      message: `Customer status updated to ${status}`,
    });
  } catch (error) {
    console.error("Verify customer error:", error);
    return NextResponse.json({ error: "Failed to update customer status" }, { status: 500 });
  }
}
