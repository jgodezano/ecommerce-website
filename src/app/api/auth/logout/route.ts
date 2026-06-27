import { NextRequest, NextResponse } from "next/server";
import { deleteSession, clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  if (sessionId) {
    deleteSession(sessionId);
  }
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
