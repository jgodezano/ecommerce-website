import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const testimonials = db.prepare("SELECT * FROM testimonials ORDER BY rating DESC").all();
  return NextResponse.json({ testimonials });
}
