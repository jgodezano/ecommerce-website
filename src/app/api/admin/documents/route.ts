import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId parameter required" }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT identity_document FROM users WHERE id = ?").get(userId) as any;
  if (!user || !user.identity_document) {
    return NextResponse.json({ error: "No document found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", user.identity_document);
  try {
    const fileBuffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".pdf" ? "application/pdf" : `image/${ext.replace(".", "")}`;
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="identity${ext}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
