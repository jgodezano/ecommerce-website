"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatDate } from "@/lib/utils";

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  created_at: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCustomerAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetch("/api/quotes")
        .then((res) => res.json())
        .then((data) => setQuotes((data.quotes || []).slice(0, 5)))
        .catch(() => {});
    }
  }, [isLoading, isAuthenticated, router]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-50",
      processing: "text-blue-600 bg-blue-50",
      quoted: "text-purple-600 bg-purple-50",
      accepted: "text-green-600 bg-green-50",
      rejected: "text-red-600 bg-red-50",
    };
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "text-gray-600 bg-gray-50"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-primary-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Welcome, {user.firstName}</h1>
          <p className="text-primary-500 mt-1">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Link
          href="/account/quotes"
          className="bg-white border border-primary-100 rounded-xl p-6 hover:shadow-lg hover:border-accent-200 transition-all group"
        >
          <span className="text-3xl">📋</span>
          <h3 className="text-lg font-bold text-primary-900 mt-3 group-hover:text-accent-600 transition-colors">My Quotes</h3>
          <p className="text-sm text-primary-500 mt-1">View and manage quotation requests</p>
          <span className="inline-block mt-3 text-xs font-semibold text-accent-600 bg-accent-50 px-2.5 py-1 rounded-full">
            {quotes.filter((q) => q.status === "pending" || q.status === "processing").length} Active
          </span>
        </Link>

        <Link
          href="/account/profile"
          className="bg-white border border-primary-100 rounded-xl p-6 hover:shadow-lg hover:border-accent-200 transition-all group"
        >
          <span className="text-3xl">👤</span>
          <h3 className="text-lg font-bold text-primary-900 mt-3 group-hover:text-accent-600 transition-colors">My Profile</h3>
          <p className="text-sm text-primary-500 mt-1">Manage your information and settings</p>
        </Link>

        <Link
          href="/quote"
          className="bg-white border border-accent-200 rounded-xl p-6 hover:shadow-lg hover:border-accent-300 transition-all group"
        >
          <span className="text-3xl">📝</span>
          <h3 className="text-lg font-bold text-primary-900 mt-3 group-hover:text-accent-600 transition-colors">New Quote</h3>
          <p className="text-sm text-primary-500 mt-1">Request a quotation for products</p>
          <span className="inline-block mt-3 text-xs font-semibold text-white bg-accent-500 px-2.5 py-1 rounded-full">
            Get Started
          </span>
        </Link>
      </div>

      {/* Recent Quotes */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary-900">Recent Quotes</h2>
          <Link href="/account/quotes" className="text-sm text-accent-600 hover:text-accent-700 font-medium">View All</Link>
        </div>
        <div className="bg-white border border-primary-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Quote #</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Date</th>
                <th className="text-left px-6 py-3 font-semibold text-primary-700">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-primary-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {quotes.length === 0 ? (
                <tr>
                  <td className="px-6 py-4" colSpan={4}>
                    <div className="text-center py-8 text-primary-400">No quotes yet. Browse products and request a quote!</div>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="text-primary-600 hover:bg-primary-50">
                    <td className="px-6 py-4 font-medium text-primary-900">{quote.quote_number}</td>
                    <td className="px-6 py-4">{formatDate(quote.created_at)}</td>
                    <td className="px-6 py-4">{statusBadge(quote.status)}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary-900">
                      {quote.total > 0 ? `PHP ${quote.total.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
