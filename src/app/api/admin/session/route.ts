import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, getUserByEmail, setSessionCookie, clearSessionCookie, deleteSession, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json();

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
      }

      const user = getUserByEmail(email);
      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const result = authenticateUser(email, password);
      if (!result) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const response = NextResponse.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      });

      setSessionCookie(response, result.sessionId);
      response.cookies.set("bm_admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    if (action === "logout") {
      const sessionId = req.cookies.get("session_id")?.value;
      if (sessionId) deleteSession(sessionId);

      const response = NextResponse.json({ success: true });
      clearSessionCookie(response);
      response.cookies.set("bm_admin_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin session error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
