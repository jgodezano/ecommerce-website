import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUserByUsername, createPasswordResetToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { login } = await req.json();
    if (!login) {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    const user = getUserByEmail(login) || getUserByUsername(login);
    if (!user) {
      return NextResponse.json({ message: "If the account exists, a reset link has been generated." });
    }

    const token = createPasswordResetToken(user.id);
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?reset=${token}`;

    console.log(`[Password Reset] User: ${user.email}, Link: ${resetLink}`);

    return NextResponse.json({
      message: "If the account exists, a reset link has been generated.",
      ...(process.env.NODE_ENV !== "production" && { resetLink }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
