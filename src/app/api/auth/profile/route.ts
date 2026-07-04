import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromRequest, updateUserProfile, updatePassword } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.firstName !== undefined || body.lastName !== undefined || body.phone !== undefined || body.companyName !== undefined) {
      updateUserProfile(session.user.id, {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        companyName: body.companyName,
      });
    }

    if (body.currentPassword && body.newPassword) {
      const bcrypt = require("bcryptjs");
      const db = getDb();
      const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(session.user.id) as any;
      if (!user || !bcrypt.compareSync(body.currentPassword, user.password_hash)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      updatePassword(session.user.id, body.newPassword);
    }

    const db = getDb();
    const updated = db.prepare(
      "SELECT id, email, username, name, first_name, last_name, phone, company_name, account_status, role FROM users WHERE id = ?"
    ).get(session.user.id) as any;

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        name: updated.name,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phone: updated.phone || "",
        companyName: updated.company_name || "",
        accountStatus: updated.account_status,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
