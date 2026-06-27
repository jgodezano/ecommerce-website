"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  total: number;
  item_count: number;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_delivery", label: "Ready for Delivery" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  processing: "text-blue-600 bg-blue-50",
  ready_for_delivery: "text-purple-600 bg-purple-50",
  out_for_delivery: "text-orange-600 bg-orange-50",
  delivered: "text-green-600 bg-green-50",
  completed: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = (statusFilter = "all") => {
    setLoading(true);
    const url = statusFilter && statusFilter !== "all" ? `/api/admin/orders?status=${statusFilter}` : "/api/admin/orders";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      fetchOrders(filter);
    } catch {}
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Order Management</h1>
          <p className="text-sm text-primary-500 mt-1">Track, process, and manage customer orders</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-primary-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Order #</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Customer</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Date</th>
                <th className="text-center px-6 py-3 font-semibold text-primary-700">Items</th>
                <th className="text-right px-6 py-3 font-semibold text-primary-700">Total</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Payment</th>
                <th className="text-right px-6 py-3 font-semibold text-primary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-primary-400" colSpan={8}>Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-primary-400" colSpan={8}>No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-primary-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary-900">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <p className="text-primary-900">{order.customer_name}</p>
                      <p className="text-xs text-primary-400">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 text-primary-600">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-center text-primary-600">{order.item_count}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary-900">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "text-gray-600 bg-gray-50"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.payment_status === "paid" ? "text-green-600 bg-green-50" :
                        order.payment_status === "failed" ? "text-red-600 bg-red-50" :
                        "text-yellow-600 bg-yellow-50"
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="text-xs border border-primary-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-accent-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
