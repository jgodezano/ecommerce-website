import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_SIZE) return NextResponse.json({ error: "File must be between 1 byte and 5MB." }, { status: 400 });

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, GIF, PDF" }, { status: 400 });

    const filename = `${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "private_uploads", "identities");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });

    const storedReference = `private:identities/${filename}`;
    getDb().prepare("UPDATE users SET identity_document = ?, account_status = CASE WHEN account_status = 'rejected' THEN 'pending' ELSE account_status END WHERE id = ?").run(storedReference, session.user.id);

    return NextResponse.json({ success: true, status: "pending" });
  } catch (error) {
    console.error("Upload identity error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
