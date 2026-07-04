"use client";

import Link from "next/link";
import { useQuote } from "@/context/QuoteContext";
import { formatPrice } from "@/lib/utils";
import { XMarkIcon, TrashIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

export default function QuoteSidebar() {
  const { items, itemCount, isOpen, removeItem, updateQuantity, updateNotes, closeQuote, clearItems } = useQuote();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={closeQuote} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
            <div>
              <h2 className="text-lg font-bold text-primary-900">Quote List</h2>
              <p className="text-sm text-primary-500">{itemCount} product(s)</p>
            </div>
            <button onClick={closeQuote} className="p-2 text-primary-500 hover:text-primary-700 rounded-lg hover:bg-primary-50">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-primary-500 mb-4">Your quote list is empty</p>
                <Link
                  href="/categories/raw-crystals"
                  onClick={closeQuote}
                  className="inline-block px-6 py-2.5 bg-accent-500 text-white rounded-lg font-medium text-sm hover:bg-accent-600"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 bg-primary-50 rounded-xl p-3">
                    <div className="w-16 h-16 rounded-lg bg-primary-200 flex-shrink-0 flex items-center justify-center text-2xl">
                      💎
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-primary-900 truncate">{item.productName}</h3>
                      <p className="text-xs text-primary-500 mt-0.5">{formatPrice(item.price)} / pc</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-primary-200 rounded-lg">
                          <button
                            onClick={() => item.quantity > 1 && updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-primary-500 hover:text-primary-700"
                          >
                            <MinusIcon className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-sm font-medium text-primary-900 min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 text-primary-500 hover:text-primary-700"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.productId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.productId, e.target.value)}
                        placeholder="Add notes..."
                        className="mt-1 w-full text-xs px-2 py-1 border border-primary-200 rounded focus:outline-none focus:border-accent-500 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-primary-100 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-primary-500">
                <span>{itemCount} product(s) for quotation</span>
                <button onClick={clearItems} className="text-red-500 hover:text-red-700 font-medium">Clear All</button>
              </div>
              <Link
                href="/quote"
                onClick={closeQuote}
                className="block w-full py-3 bg-accent-500 text-white text-center font-semibold rounded-lg hover:bg-accent-600 transition-colors"
              >
                Request Quote
              </Link>
              <Link
                href="/account/quotes"
                onClick={closeQuote}
                className="block w-full py-2.5 text-center text-sm font-medium text-primary-600 hover:text-primary-800"
              >
                View My Quotes
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


