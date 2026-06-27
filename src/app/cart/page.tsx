"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useStock } from "@/context/StockContext";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const { cart, removeItem, updateQuantity } = useCart();
  const { checkAvailability } = useStock();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/cart");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-primary-400">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-8">Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">Your cart is empty</h2>
          <p className="text-primary-500 mb-6">Looks like you haven&apos;t added any products yet.</p>
          <Link href="/categories/hollow-blocks">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white border border-primary-100 rounded-xl p-4">
                <div className="w-24 h-24 rounded-xl bg-primary-100 overflow-hidden relative flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`} className="text-sm font-semibold text-primary-900 hover:text-accent-600">
                    {item.name}
                  </Link>
                  <p className="text-xs text-primary-500 mt-0.5">Size: {item.size}</p>
                  <p className="text-lg font-bold text-accent-600 mt-1">{formatPrice(item.unitPrice)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-primary-200 rounded-lg">
                      <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)} className="p-2 text-primary-500 hover:text-primary-700">
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-sm font-medium text-primary-900">{item.quantity}</span>
                      <button onClick={() => {
                        const { available } = checkAvailability(item.productId, item.quantity + 1, item.size);
                        if (available) updateQuantity(item.id, item.quantity + 1);
                      }} className="p-2 text-primary-500 hover:text-primary-700">
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary-500">Subtotal</p>
                  <p className="text-lg font-bold text-primary-900">{formatPrice(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-primary-50 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-primary-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Tax (12% VAT)</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Calculated at checkout</span>
                </div>
                <div className="border-t border-primary-200 pt-3 flex justify-between text-lg font-bold text-primary-900">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              <Link href="/checkout" className="mt-6 block">
                <Button size="lg" className="w-full text-base">
                  Proceed to Checkout
                </Button>
              </Link>
              <Link href="/categories/hollow-blocks" className="mt-3 block text-center text-sm text-primary-500 hover:text-accent-600">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
