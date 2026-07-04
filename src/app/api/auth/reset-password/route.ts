import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetToken, updatePassword, markResetTokenUsed, deleteUserSessions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = verifyPasswordResetToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    updatePassword(user.id, password);
    markResetTokenUsed(token);
    deleteUserSessions(user.id);

    return NextResponse.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
