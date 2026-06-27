import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    // In production, use PayPal SDK to create order
    return NextResponse.json({
      id: `paypal_mock_${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
  }
}
