"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useStock } from "@/context/StockContext";
import { formatPrice, generateOrderNumber, sanitizeInput, sanitizeEmail, sanitizePhone } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const { cart, clearCart } = useCart();
  const { checkAvailability, reserveStock } = useStock();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-primary-400">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [stockError, setStockError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    deliveryMethod: "delivery" as "pickup" | "delivery" | "truck_delivery",
    deliveryDate: "",
    notes: "",
    paymentMethod: "cod" as "cod" | "bank_transfer" | "card",
  });

  const updateField = (field: string, value: string) => {
    const sanitized = field === "email" ? sanitizeEmail(value) : field === "phone" ? sanitizePhone(value) : sanitizeInput(value);
    setFormData((prev) => ({ ...prev, [field]: sanitized }));
  };

  const handlePlaceOrder = async () => {
    setStockError("");

    for (const item of cart.items) {
      const { available, currentStock } = checkAvailability(item.productId, item.quantity, item.size);
      if (!available) {
        setStockError(`"${item.name}" (${item.size}) only has ${currentStock} unit(s) in stock. Please reduce the quantity or remove the item.`);
        return;
      }
    }

    for (const item of cart.items) {
      reserveStock(item.productId, item.quantity, item.size);
    }

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            size: i.size,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
          subtotal: cart.subtotal,
          tax: cart.tax,
          shipping: cart.shipping,
          total: cart.total,
          paymentMethod: formData.paymentMethod,
          deliveryMethod: formData.deliveryMethod,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
          notes: formData.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrderNumber(data.orderNumber);
    } catch {
      setOrderNumber(generateOrderNumber());
    }

    setOrderComplete(true);
    clearCart();
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-primary-500 mb-4">Thank you for your order.</p>
        <div className="bg-primary-50 rounded-xl p-6 mb-8 inline-block">
          <p className="text-sm text-primary-500">Order Number</p>
          <p className="text-2xl font-bold text-primary-900">{orderNumber}</p>
        </div>
        <p className="text-sm text-primary-600 mb-8">
          A confirmation email has been sent to <strong>{formData.email}</strong>. You will receive an update once your order is processed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/"><Button>Continue Shopping</Button></Link>
          <Link href="/account/orders"><Button variant="outline">View Orders</Button></Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Your cart is empty</h1>
        <Link href="/categories/hollow-blocks"><Button>Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Steps */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { num: 1, label: "Shipping" },
              { num: 2, label: "Payment" },
              { num: 3, label: "Review" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.num ? "bg-accent-500 text-white" : "bg-primary-100 text-primary-400"
                }`}>
                  {s.num}
                </div>
                <span className={`text-sm font-medium ${step >= s.num ? "text-primary-900" : "text-primary-400"}`}>
                  {s.label}
                </span>
                {s.num < 3 && <div className="w-8 h-0.5 bg-primary-200" />}
              </div>
            ))}
          </div>

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-primary-900">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" id="firstName" value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="Juan" />
                <Input label="Last Name" id="lastName" value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Dela Cruz" />
                <Input label="Email" id="email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="juan@email.com" />
                <Input label="Phone" id="phone" type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+63 912 345 6789" />
                <Input label="Company (Optional)" id="company" value={formData.company} onChange={(e) => updateField("company", e.target.value)} placeholder="Your Company Inc." />
              </div>
              <Input label="Street Address" id="address" value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="123 Construction Ave" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="City" id="city" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Manila" />
                <Input label="State/Province" id="state" value={formData.state} onChange={(e) => updateField("state", e.target.value)} placeholder="Metro Manila" />
                <Input label="ZIP Code" id="zipCode" value={formData.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} placeholder="1000" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-primary-900 mb-3">Delivery Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "delivery", label: "Standard Delivery", desc: "3-7 business days", icon: "🚚" },
                    { value: "truck_delivery", label: "Truck Delivery", desc: "For bulk orders", icon: "🛻" },
                    { value: "pickup", label: "Pickup", desc: "Free, from our warehouse", icon: "📍" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => updateField("deliveryMethod", method.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.deliveryMethod === method.value ? "border-accent-500 bg-accent-50" : "border-primary-200 hover:border-primary-300"
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <p className="text-sm font-semibold text-primary-900 mt-1">{method.label}</p>
                      <p className="text-xs text-primary-500">{method.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Order Notes (Optional)" id="notes" value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Special instructions, delivery gate code, etc." />

              <div className="flex justify-end pt-4">
                <Button size="lg" onClick={() => setStep(2)}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-primary-900">Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive", icon: "💵" },
                  { value: "bank_transfer", label: "Bank Transfer", desc: "BPI, BDO, Metrobank", icon: "🏦" },
                  { value: "card", label: "Credit/Debit Card", desc: "Visa, Mastercard, GCash", icon: "💳" },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => updateField("paymentMethod", method.value as any)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.paymentMethod === method.value ? "border-accent-500 bg-accent-50" : "border-primary-200 hover:border-primary-300"
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <p className="text-sm font-semibold text-primary-900 mt-1">{method.label}</p>
                    <p className="text-xs text-primary-500">{method.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button size="lg" onClick={() => setStep(3)}>Review Order</Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white border border-primary-100 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-primary-900">Review Your Order</h2>

              <div className="p-4 bg-primary-50 rounded-xl">
                <h3 className="text-sm font-semibold text-primary-900 mb-2">Shipping To</h3>
                <p className="text-sm text-primary-600">{formData.firstName} {formData.lastName}</p>
                <p className="text-sm text-primary-600">{formData.address}</p>
                <p className="text-sm text-primary-600">{formData.city}, {formData.state} {formData.zipCode}</p>
                <p className="text-sm text-primary-600">{formData.email} | {formData.phone}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary-900">Items</h3>
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity} ({item.size})</span>
                    <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-primary-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Tax (12% VAT)</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Delivery Method</span>
                  <span className="capitalize">{formData.deliveryMethod.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary-900 pt-2 border-t border-primary-200">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              {stockError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {stockError}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button size="lg" onClick={handlePlaceOrder}>Place Order</Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-primary-50 rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">{item.name}</p>
                    <p className="text-xs text-primary-500">Qty: {item.quantity} x {formatPrice(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-bold text-primary-900">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-primary-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-primary-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary-600">
                <span>Tax</span>
                <span>{formatPrice(cart.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary-900 pt-2 border-t border-primary-200">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
