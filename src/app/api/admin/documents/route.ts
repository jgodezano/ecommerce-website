import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

function resolveStoredPath(reference: string): string {
  if (reference.startsWith("private:identities/")) {
    const filename = path.basename(reference.slice("private:identities/".length));
    return path.join(process.cwd(), "private_uploads", "identities", filename);
  }
  const legacyPath = reference.replace(/^\/+/, "");
  if (legacyPath.includes("..") || !legacyPath.startsWith("uploads/identities/")) throw new Error("Invalid document reference");
  return path.join(process.cwd(), "public", legacyPath);
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId parameter required" }, { status: 400 });

  const user = getDb().prepare("SELECT identity_document FROM users WHERE id = ?").get(userId) as { identity_document?: string } | undefined;
  if (!user?.identity_document) return NextResponse.json({ error: "No document found" }, { status: 404 });

  try {
    const filePath = resolveStoredPath(user.identity_document);
    const fileBuffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : "image/jpeg";
    return new NextResponse(fileBuffer, { headers: { "Content-Type": contentType, "Content-Disposition": `inline; filename="identity${ext}"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
