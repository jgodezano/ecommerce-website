"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  created_at: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account/quotes");
      return;
    }
    if (isAuthenticated) {
      fetch("/api/quotes")
        .then((res) => res.json())
        .then((data) => setQuotes(data.quotes || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-primary-400">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-50",
    processing: "text-blue-600 bg-blue-50",
    quoted: "text-purple-600 bg-purple-50",
    accepted: "text-green-600 bg-green-50",
    rejected: "text-red-600 bg-red-50",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-900">My Quotes</h1>
        <Link href="/quote"><Button variant="outline" size="sm">Request New Quote</Button></Link>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white border border-primary-100 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-3xl">📄</span>
          </div>
          <p className="text-primary-500 mb-4">No quotation requests yet.</p>
          <Link href="/quote" className="mt-4 inline-block text-accent-600 text-sm font-medium hover:text-accent-700">Request a Quote &rarr;</Link>
        </div>
      ) : (
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
              {quotes.map((quote) => (
                <tr key={quote.id} className="text-primary-600 hover:bg-primary-50">
                  <td className="px-6 py-4 font-medium text-primary-900">{quote.quote_number}</td>
                  <td className="px-6 py-4">{formatDate(quote.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[quote.status] || "text-gray-600 bg-gray-50"}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary-900">{quote.total ? formatPrice(quote.total) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
