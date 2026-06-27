"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account/orders");
      return;
    }
    if (isAuthenticated) {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data.orders || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center text-primary-400">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-50",
    processing: "text-blue-600 bg-blue-50",
    ready_for_delivery: "text-purple-600 bg-purple-50",
    out_for_delivery: "text-orange-600 bg-orange-50",
    delivered: "text-green-600 bg-green-50",
    completed: "text-green-600 bg-green-50",
    cancelled: "text-red-600 bg-red-50",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">No orders yet</h2>
          <p className="text-primary-500 mb-6">Start shopping to see your orders here.</p>
          <Link href="/categories/hollow-blocks" className="inline-block px-6 py-3 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-primary-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Order #</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Date</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-primary-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {orders.map((order) => (
                <tr key={order.id} className="text-primary-600 hover:bg-primary-50">
                  <td className="px-6 py-4 font-medium text-primary-900">{order.order_number}</td>
                  <td className="px-6 py-4">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "text-gray-600 bg-gray-50"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary-900">{formatPrice(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
