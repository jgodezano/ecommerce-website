"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-primary-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Welcome, {user.firstName}</h1>
          <p className="text-primary-500 mt-1">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "My Orders",
            desc: "View and track your orders",
            icon: "📦",
            href: "/account/orders",
            count: "3 Active",
          },
          {
            title: "My Quotes",
            desc: "View quotation requests",
            icon: "📋",
            href: "/account/quotes",
            count: "2 Pending",
          },
          {
            title: "Wishlist",
            desc: "Products you&apos;ve saved",
            icon: "❤️",
            href: "/account/wishlist",
            count: "5 Items",
          },
          {
            title: "Profile",
            desc: "Manage your information",
            icon: "👤",
            href: "#",
            count: "",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white border border-primary-100 rounded-xl p-6 hover:shadow-lg hover:border-accent-200 transition-all group"
          >
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-lg font-bold text-primary-900 mt-3 group-hover:text-accent-600 transition-colors">{item.title}</h3>
            <p className="text-sm text-primary-500 mt-1">{item.desc}</p>
            {item.count && <span className="inline-block mt-3 text-xs font-semibold text-accent-600 bg-accent-50 px-2.5 py-1 rounded-full">{item.count}</span>}
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-primary-900 mb-4">Recent Orders</h2>
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
              <tr className="text-primary-600">
                <td className="px-6 py-4" colSpan={4}>
                  <div className="text-center py-8 text-primary-400">No orders yet. Start shopping to see your orders here.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
