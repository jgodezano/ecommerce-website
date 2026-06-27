"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { formatPrice, formatDate } from "@/lib/utils";

interface DashboardStats {
  productCount: number;
  activeOrders: number;
  pendingQuotes: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  processing: "text-blue-600 bg-blue-50",
  ready_for_delivery: "text-purple-600 bg-purple-50",
  out_for_delivery: "text-orange-600 bg-orange-50",
  delivered: "text-green-600 bg-green-50",
  completed: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
};

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    productCount: 0, activeOrders: 0, pendingQuotes: 0, revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => data.stats && setStats(data.stats))
      .catch(() => {});
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setRecentOrders((data.orders || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const statCards = [
    { title: "Total Products", value: String(stats.productCount), change: "All categories", icon: "📦", color: "bg-blue-50 text-blue-600" },
    { title: "Active Orders", value: String(stats.activeOrders), change: "Not yet delivered", icon: "📋", color: "bg-green-50 text-green-600" },
    { title: "Pending Quotes", value: String(stats.pendingQuotes), change: "Awaiting review", icon: "📄", color: "bg-orange-50 text-orange-600" },
    { title: "Total Revenue", value: formatPrice(stats.revenue), change: "From delivered orders", icon: "💰", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name || "Admin"}</p>
        </div>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.change}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Low Stock Alert */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-2">
            {[
              { label: "Add Product", href: "/admin/products", icon: "➕" },
              { label: "View Quotes", href: "/admin/quotes", icon: "📋" },
              { label: "Manage Orders", href: "/admin/orders", icon: "📦" },
              { label: "View Customers", href: "/admin/customers", icon: "👥" },
            ].map((action) => (
              <Link key={action.label} href={action.href} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-orange-50 transition-colors">
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-medium text-gray-900">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Stats Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Products</span>
              <span className="font-bold text-gray-900">{stats.productCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Orders</span>
              <span className="font-bold text-gray-900">{stats.activeOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Quotes</span>
              <span className="font-bold text-gray-900">{stats.pendingQuotes}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Revenue</span>
              <span className="font-bold text-purple-600">{formatPrice(stats.revenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-accent-500 hover:text-accent-600">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Order #</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-gray-400" colSpan={5}>No orders yet. Orders will appear here once customers start purchasing.</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-5 py-3 text-gray-600">{order.customer_name}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "text-gray-600 bg-gray-50"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatPrice(order.total)}</td>
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
