import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, setSessionCookie, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { login, password, remember } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ error: "Username/email and password are required" }, { status: 400 });
    }

    const result = authenticateUser(login, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid username/email or password" }, { status: 401 });
    }

    if (result.user.account_status !== "approved") {
      return NextResponse.json({
        error: "Your account is pending approval. Please wait for an administrator to activate your account.",
        accountStatus: result.user.account_status,
      }, { status: 403 });
    }

    const response = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        name: result.user.name,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        phone: result.user.phone || "",
        companyName: result.user.company_name || "",
        accountStatus: result.user.account_status,
        role: result.user.role,
      },
    });

    setSessionCookie(response, result.sessionId, !!remember);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
