import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = authenticateUser(email, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
      },
    });

    setSessionCookie(response, result.sessionId);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
