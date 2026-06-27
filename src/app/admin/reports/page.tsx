"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  totalQuotes: number;
  pendingQuotes: number;
  conversionRate: number;
  topProducts: { name: string; total: number }[];
  monthlyRevenue: { month: string; total: number }[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, customersRes, quotesRes, statsRes] = await Promise.all([
          fetch("/api/admin/orders").then((r) => r.json()),
          fetch("/api/admin/customers").then((r) => r.json()),
          fetch("/api/admin/quotes").then((r) => r.json()),
          fetch("/api/admin/stats").then((r) => r.json()),
        ]);

        const orders = ordersRes.orders || [];
        const customers = customersRes.customers || [];
        const quotes = quotesRes.quotes || [];

        const totalRevenue = orders
          .filter((o: any) => ["delivered", "completed"].includes(o.status))
          .reduce((sum: number, o: any) => sum + o.total, 0);

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalCustomers = customers.length;
        const totalQuotes = quotes.length;
        const pendingQuotes = quotes.filter((q: any) => q.status === "pending").length;

        // Top products from order_items
        const productMap: Record<string, number> = {};
        const itemPromises = orders.map((o: any) =>
          fetch(`/api/admin/orders/${o.id}`).then((r) => r.json()).catch(() => ({ items: [] }))
        );
        const orderDetails = await Promise.all(itemPromises);
        for (const detail of orderDetails) {
          for (const item of detail.items || []) {
            productMap[item.product_name] = (productMap[item.product_name] || 0) + item.total_price;
          }
        }
        const topProducts = Object.entries(productMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, total]) => ({ name, total }));

        // Monthly revenue
        const monthlyMap: Record<string, number> = {};
        for (const o of orders) {
          if (["delivered", "completed"].includes(o.status)) {
            const key = formatShortDate(o.created_at);
            monthlyMap[key] = (monthlyMap[key] || 0) + o.total;
          }
        }
        const monthlyRevenue = Object.entries(monthlyMap)
          .sort(([a], [b]) => {
            const da = new Date(a);
            const db = new Date(b);
            return da.getTime() - db.getTime();
          })
          .slice(-12)
          .map(([month, total]) => ({ month, total }));

        const conversionRate = totalQuotes > 0
          ? Math.round((quotes.filter((q: any) => q.status === "converted").length / totalQuotes) * 100)
          : 0;

        setData({
          totalRevenue, totalOrders, avgOrderValue, totalCustomers,
          totalQuotes, pendingQuotes, conversionRate, topProducts, monthlyRevenue,
        });
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-primary-50 p-6 lg:p-8 text-center text-primary-400">Loading reports...</div>;
  }

  const maxMonthlyRevenue = data?.monthlyRevenue.length
    ? Math.max(...data.monthlyRevenue.map((m) => m.total))
    : 1;

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Sales Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl border border-primary-100 p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-4">Monthly Revenue</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
              data.monthlyRevenue.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-primary-400 font-medium">
                    {m.total > 0 ? `₱${(m.total / 1000).toFixed(0)}k` : ""}
                  </span>
                  <div
                    className="w-full bg-accent-500 rounded-t-md transition-all hover:bg-accent-600"
                    style={{ height: `${Math.max(4, (m.total / maxMonthlyRevenue) * 100)}%` }}
                  />
                  <span className="text-xs text-primary-500">{m.month}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-primary-400">No data yet</div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-primary-100 p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-4">Top Products by Revenue</h2>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-primary-400">#{i + 1}</span>
                    <span className="text-sm text-primary-900">{product.name}</span>
                  </div>
                  <span className="text-sm font-medium text-primary-900">{formatPrice(product.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-primary-400">No sales data yet</div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-xl border border-primary-100 p-6">
        <h2 className="text-lg font-bold text-primary-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data ? [
            { label: "Total Revenue", value: formatPrice(data.totalRevenue) },
            { label: "Total Orders", value: String(data.totalOrders) },
            { label: "Avg. Order Value", value: formatPrice(Math.round(data.avgOrderValue)) },
            { label: "Total Customers", value: String(data.totalCustomers) },
            { label: "Pending Quotes", value: String(data.pendingQuotes) },
            { label: "Total Quotes", value: String(data.totalQuotes) },
            { label: "Quote-to-Order Rate", value: `${data.conversionRate}%` },
            { label: "Monthly Revenue", value: data.monthlyRevenue.length > 0 ? formatPrice(Math.round(data.monthlyRevenue[data.monthlyRevenue.length - 1].total)) : "—" },
          ].map((metric) => (
            <div key={metric.label} className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-900">{metric.value}</p>
              <p className="text-xs text-primary-500 mt-1">{metric.label}</p>
            </div>
          )) : null}
        </div>
      </div>
    </div>
  );
}
