"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useStock } from "@/context/StockContext";
import { formatPrice } from "@/lib/utils";
import { XMarkIcon, TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function CartSidebar() {
  const { cart, removeItem, updateQuantity, toggleCart } = useCart();
  const { user: customer, isAuthenticated: isCustomerAuth } = useCustomerAuth();
  const { checkAvailability } = useStock();

  return (
    <>
      {/* Overlay */}
      {cart.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={toggleCart} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 shadow-2xl ${
          cart.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
            <div>
              <h2 className="text-lg font-bold text-primary-900">Shopping Cart</h2>
              <p className="text-sm text-primary-500">{cart.itemCount} item(s)</p>
            </div>
            <button onClick={toggleCart} className="p-2 text-primary-500 hover:text-primary-700 rounded-lg hover:bg-primary-50">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <p className="text-primary-500 mb-4">Your cart is empty</p>
                <Link
                  href="/categories/hollow-blocks"
                  onClick={toggleCart}
                  className="inline-block px-6 py-2.5 bg-accent-500 text-white rounded-lg font-medium text-sm hover:bg-accent-600"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-primary-50 rounded-xl p-3">
                    <div className="w-20 h-20 rounded-lg bg-primary-200 flex-shrink-0 overflow-hidden relative">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-primary-900 truncate">{item.name}</h3>
                      <p className="text-xs text-primary-500 mt-0.5">Size: {item.size}</p>
                      <p className="text-sm font-bold text-accent-600 mt-1">{formatPrice(item.unitPrice)}/pc</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-primary-200 rounded-lg">
                          <button
                            onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-primary-500 hover:text-primary-700"
                          >
                            <MinusIcon className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-sm font-medium text-primary-900 min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const { available } = checkAvailability(item.productId, item.quantity + 1, item.size);
                              if (available) updateQuantity(item.id, item.quantity + 1);
                            }}
                            className="p-1 text-primary-500 hover:text-primary-700"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="border-t border-primary-100 px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Subtotal</span>
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
                <div className="flex justify-between text-base font-bold text-primary-900 pt-2 border-t border-primary-200">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              {isCustomerAuth ? (
                <Link
                  href="/checkout"
                  onClick={toggleCart}
                  className="block w-full py-3 bg-accent-500 text-white text-center font-semibold rounded-lg hover:bg-accent-600 transition-colors"
                >
                  Proceed to Checkout
                </Link>
              ) : (
                <Link
                  href="/login?redirect=/checkout"
                  onClick={toggleCart}
                  className="block w-full py-3 bg-accent-500 text-white text-center font-semibold rounded-lg hover:bg-accent-600 transition-colors"
                >
                  Proceed to Checkout
                </Link>
              )}
              <Link
                href="/cart"
                onClick={toggleCart}
                className="block w-full py-2.5 text-center text-sm font-medium text-primary-600 hover:text-primary-800"
              >
                View Cart Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
