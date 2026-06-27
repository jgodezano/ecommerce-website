export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  clientSecret?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Stripe integration
export async function createStripePaymentIntent(
  amount: number,
  currency: string = "php"
): Promise<PaymentIntent> {
  const response = await fetch("/api/payments/stripe/create-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency }),
  });
  return response.json();
}

// PayPal integration
export async function createPayPalOrder(amount: number): Promise<{ id: string }> {
  const response = await fetch("/api/payments/paypal/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return response.json();
}

export async function capturePayPalOrder(orderId: string): Promise<PaymentResult> {
  const response = await fetch("/api/payments/paypal/capture-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return response.json();
}

// Local payment methods (Bank Transfer, GCash, etc.)
export async function processLocalPayment(
  method: string,
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  const response = await fetch("/api/payments/local/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, orderId, amount }),
  });
  return response.json();
}

// Get payment instructions for bank transfers
export function getPaymentInstructions(method: string) {
  const instructions: Record<string, { accountName: string; accountNumber: string; bank: string }> = {
    bpi: {
      bank: "Bank of the Philippine Islands (BPI)",
      accountName: "Merica House of Rocks",
      accountNumber: "1234-5678-90",
    },
    bdo: {
      bank: "Banco de Oro (BDO)",
      accountName: "Merica House of Rocks",
      accountNumber: "1234-5678-90",
    },
    metrobank: {
      bank: "Metrobank",
      accountName: "Merica House of Rocks",
      accountNumber: "1234-5678-90",
    },
    gcash: {
      bank: "GCash",
      accountName: "Merica House of Rocks",
      accountNumber: "0912 345 6789",
    },
  };

  return instructions[method] || null;
}
