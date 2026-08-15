import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seeding is disabled in production" }, { status: 404 });
  }

  try {
    seedDatabase();
    return NextResponse.json({
      message: "Demo database seeded successfully",
      demoCustomer: { email: "demo@mericahouseofrocks.ph", password: "demo123" },
      demoAdmin: { email: "admin@mericahouseofrocks.ph", password: "admin123" },
      included: ["landscaping materials", "estimation coverage", "recommendation tags", "delivery and installation services"],
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Unable to seed the demo database" }, { status: 500 });
  }
}
