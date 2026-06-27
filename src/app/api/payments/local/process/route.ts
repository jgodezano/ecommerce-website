import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { method, orderId, amount } = await req.json();

    const validMethods = ["cod", "bank_transfer", "gcash"];
    if (!validMethods.includes(method)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transactionId: `local_${method}_${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Payment processing failed" }, { status: 500 });
  }
}
