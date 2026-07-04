"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDate } from "@/lib/utils";

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  items: string;
  notes: string;
  admin_notes: string;
  project_details: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  processing: "text-blue-600 bg-blue-50",
  quoted: "text-purple-600 bg-purple-50",
  accepted: "text-green-600 bg-green-50",
  rejected: "text-red-600 bg-red-50",
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [customTotal, setCustomTotal] = useState("");

  const fetchQuotes = (statusFilter = "all") => {
    setLoading(true);
    const url = statusFilter && statusFilter !== "all" ? `/api/admin/quotes?status=${statusFilter}` : "/api/admin/quotes";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setQuotes(data.quotes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotes(filter);
  }, [filter]);

  const updateQuote = async (quoteId: string, status: string) => {
    setUpdating(quoteId);
    try {
      const body: any = { quoteId, status };
      if (adminNotes) body.adminNotes = adminNotes;
      if (customTotal) body.total = parseFloat(customTotal);
      await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchQuotes(filter);
      setExpanded(null);
      setAdminNotes("");
      setCustomTotal("");
    } catch {}
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Quote Management</h1>
          <p className="text-sm text-primary-500 mt-1">Review and manage customer quotation requests</p>
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

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-primary-100 p-12 text-center">
            <p className="text-primary-400">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-primary-100 p-12 text-center">
            <p className="text-primary-400">No quotation requests found.</p>
          </div>
        ) : (
          quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-xl border border-primary-100 overflow-hidden">
              <div className="p-5 flex items-start justify-between cursor-pointer" onClick={() => setExpanded(expanded === quote.id ? null : quote.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-primary-900">{quote.quote_number}</h3>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status] || "text-gray-600 bg-gray-50"}`}>
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-sm text-primary-600">{quote.customer_name} &lt;{quote.customer_email}&gt;</p>
                  <p className="text-xs text-primary-400 mt-1">{formatDate(quote.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-900">{quote.total ? formatPrice(quote.total) : "—"}</p>
                  <span className="text-xs text-primary-400">{expanded === quote.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expanded === quote.id && (
                <div className="border-t border-primary-100 p-5 space-y-4 bg-primary-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Customer Info</h4>
                      <p className="text-sm text-primary-900">{quote.customer_name}</p>
                      <p className="text-sm text-primary-600">{quote.customer_email}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Project Details</h4>
                      <p className="text-sm text-primary-900 whitespace-pre-wrap">{quote.notes || "No details provided"}</p>
                    </div>
                  </div>

                  {quote.items && (() => {
                    try {
                      const items = JSON.parse(quote.items);
                      if (items.length > 0) {
                        return (
                          <div>
                            <h4 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Items Requested</h4>
                            <div className="bg-white rounded-lg border border-primary-100 divide-y divide-primary-100">
                              {items.map((item: any, i: number) => (
                                <div key={i} className="px-4 py-2 flex justify-between text-sm">
                                  <span className="text-primary-900">{item.productName || item.name}</span>
                                  <span className="text-primary-600">{item.quantity} {item.unit || "pc"}{item.notes ? ` — ${item.notes}` : ""}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                        placeholder="Internal notes..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">Custom Total (optional)</label>
                      <input
                        type="number"
                        value={customTotal}
                        onChange={(e) => setCustomTotal(e.target.value)}
                        className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateQuote(quote.id, opt.value)}
                        disabled={updating === quote.id || opt.value === quote.status}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          opt.value === quote.status
                            ? "bg-primary-100 text-primary-400 cursor-not-allowed"
                            : opt.value === "approved"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : opt.value === "rejected"
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-accent-500 text-white hover:bg-accent-600"
                        }`}
                      >
                        {opt.value === quote.status ? "Current" : `Mark ${opt.label}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
