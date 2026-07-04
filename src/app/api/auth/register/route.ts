import { NextRequest, NextResponse } from "next/server";
import { createUser, setSessionCookie, createSession, getUserByEmail, getUserByUsername } from "@/lib/auth";
import { getDb } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password, firstName, lastName, companyName, phone, deliveryAddress } = await req.json();

    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (getUserByEmail(email)) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    if (getUserByUsername(username)) {
      return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
    }

    const name = `${firstName} ${lastName}`;
    const user = createUser(email, username, password, name, firstName, lastName, "customer", companyName || "", phone || "");

    // Save delivery address if provided
    if (deliveryAddress) {
      const db = getDb();
      const addressId = crypto.randomUUID();
      db.prepare(
        "INSERT INTO addresses (id, customer_id, label, street, city, state, zip, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
      ).run(
        addressId, user.id, "Default",
        deliveryAddress.street || "",
        deliveryAddress.city || "",
        deliveryAddress.state || "",
        deliveryAddress.zip || ""
      );
    }

    const session = createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || "",
        companyName: user.company_name || "",
        accountStatus: user.account_status,
        role: user.role,
      },
      message: "Registration successful. Your account is pending approval.",
    });

    setSessionCookie(response, session.id);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
