import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      name: session.user.name,
      firstName: session.user.first_name,
      lastName: session.user.last_name,
      phone: session.user.phone || "",
      companyName: session.user.company_name || "",
      accountStatus: session.user.account_status,
      identityDocument: session.user.identity_document,
      role: session.user.role,
    },
  });
}
