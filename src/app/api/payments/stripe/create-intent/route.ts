import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency } = await req.json();

    // In production, use Stripe SDK:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100),
    //   currency: currency || 'php',
    // });

    return NextResponse.json({
      id: `pi_mock_${Date.now()}`,
      amount,
      currency: currency || "php",
      status: "pending",
      clientSecret: `pi_mock_secret_${Date.now()}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
