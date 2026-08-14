"use client";

import { useEffect, useState } from "react";
import { formatDate, formatPrice } from "@/lib/utils";

type Quote = {
  id: string;
  quote_number: string;
  display_customer_name?: string;
  display_customer_email?: string;
  workflow_status?: string;
  total: number;
  material_total?: number;
  delivery_fee?: number;
  service_total?: number;
  other_charges?: number;
  discount?: number;
  area_sqm?: number;
  project_location?: string;
  timeline?: string;
  items: any[];
  services: any[];
  notes: string;
  admin_notes: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  ["draft", "Draft"],
  ["pending_review", "Pending Review"],
  ["quoted", "Quoted"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["converted_to_order", "Converted to Order"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "text-gray-600 bg-gray-100",
  pending_review: "text-yellow-700 bg-yellow-50",
  quoted: "text-purple-700 bg-purple-50",
  approved: "text-green-700 bg-green-50",
  rejected: "text-red-700 bg-red-50",
  converted_to_order: "text-blue-700 bg-blue-50",
  completed: "text-emerald-700 bg-emerald-50",
  cancelled: "text-gray-600 bg-gray-100",
};

function labelForStatus(value: string) {
  return STATUS_OPTIONS.find(([key]) => key === value)?.[1] || value.replace(/_/g, " ");
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState("");

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const response = await fetch(`/api/admin/quotes?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load quotations");
      setQuotes(data.quotes || []);
    } catch (err: any) {
      setError(err.message || "Unable to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchQuotes(); }, [filter]);

  const openQuote = (quote: Quote) => {
    setExpanded(expanded === quote.id ? null : quote.id);
    setDraft({
      workflowStatus: quote.workflow_status || "pending_review",
      adminNotes: quote.admin_notes || "",
      materialTotal: String(quote.material_total ?? quote.total ?? 0),
      deliveryFee: String(quote.delivery_fee ?? 0),
      serviceTotal: String(quote.service_total ?? 0),
      otherCharges: String(quote.other_charges ?? 0),
      discount: String(quote.discount ?? 0),
    });
    setError("");
  };

  const updateQuote = async (action?: "convert_to_order") => {
    if (!expanded) return;
    setUpdating(expanded);
    setError("");
    try {
      const response = await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: expanded,
          action,
          workflowStatus: action ? "converted_to_order" : draft.workflowStatus,
          adminNotes: draft.adminNotes,
          materialTotal: Number(draft.materialTotal || 0),
          deliveryFee: Number(draft.deliveryFee || 0),
          serviceTotal: Number(draft.serviceTotal || 0),
          otherCharges: Number(draft.otherCharges || 0),
          discount: Number(draft.discount || 0),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update quotation");
      await fetchQuotes();
      if (action) alert(`Quotation converted to order ${data.orderNumber}`);
    } catch (err: any) {
      setError(err.message || "Unable to update quotation");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-2xl font-bold text-primary-900">Quotation Management</h1><p className="mt-1 text-sm text-primary-500">Review estimates, adjust pricing, approve requests, and convert quotations into orders.</p></div>
        <div className="flex flex-wrap gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void fetchQuotes()} placeholder="Search quote or customer" className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm" /><button onClick={() => void fetchQuotes()} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white">Search</button><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm"><option value="all">All Status</option>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="space-y-4">
        {loading ? <div className="rounded-xl border border-primary-100 bg-white p-12 text-center text-primary-400">Loading quotations…</div> : quotes.length === 0 ? <div className="rounded-xl border border-primary-100 bg-white p-12 text-center text-primary-400">No quotation requests found.</div> : quotes.map((quote) => {
          const status = quote.workflow_status || "pending_review";
          return <div key={quote.id} className="overflow-hidden rounded-xl border border-primary-100 bg-white">
            <button className="flex w-full items-start justify-between p-5 text-left" onClick={() => openQuote(quote)}><div><div className="mb-1 flex flex-wrap items-center gap-3"><h3 className="font-bold text-primary-900">{quote.quote_number}</h3><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>{labelForStatus(status)}</span></div><p className="text-sm text-primary-600">{quote.display_customer_name || "Customer"} · {quote.display_customer_email || "No email"}</p><p className="mt-1 text-xs text-primary-400">{formatDate(quote.created_at)}{quote.area_sqm ? ` · ${quote.area_sqm} m²` : ""}{quote.project_location ? ` · ${quote.project_location}` : ""}</p></div><div className="text-right"><p className="font-bold text-primary-900">{formatPrice(quote.total || 0)}</p><span className="text-xs text-primary-400">{expanded === quote.id ? "▲" : "▼"}</span></div></button>
            {expanded === quote.id && <div className="space-y-5 border-t border-primary-100 bg-primary-50/50 p-5">
              <div className="grid gap-4 lg:grid-cols-3"><div className="rounded-lg bg-white p-4"><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Customer</h4><p className="text-sm text-primary-900">{quote.display_customer_name || "—"}</p><p className="text-sm text-primary-600">{quote.display_customer_email || "—"}</p></div><div className="rounded-lg bg-white p-4"><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Project</h4><p className="text-sm text-primary-900">{quote.area_sqm ? `${quote.area_sqm} m²` : "Area not provided"}</p><p className="text-sm text-primary-600">{quote.project_location || "Location not provided"}</p></div><div className="rounded-lg bg-white p-4"><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Customer Notes</h4><p className="whitespace-pre-wrap text-sm text-primary-700">{quote.notes || "No notes provided"}</p></div></div>
              <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Estimated Materials</h4><div className="divide-y divide-primary-100 rounded-lg border border-primary-100 bg-white">{(quote.items || []).length ? quote.items.map((item: any, index: number) => <div key={index} className="flex items-center justify-between px-4 py-3 text-sm"><span className="text-primary-900">{item.name || item.productName}</span><span className="text-primary-600">{item.quantity} {item.unit || "unit"} · {formatPrice(item.totalPrice || 0)}</span></div>) : <p className="p-4 text-sm text-primary-400">No material items recorded.</p>}</div></div>
              {(quote.services || []).length > 0 && <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Requested Services</h4><div className="divide-y divide-primary-100 rounded-lg border border-primary-100 bg-white">{quote.services.map((service: any, index: number) => <div key={index} className="flex items-center justify-between px-4 py-3 text-sm"><span>{service.name}</span><span>{formatPrice(service.total || service.price || 0)}</span></div>)}</div></div>}
              <div className="grid gap-4 md:grid-cols-5"><label className="text-xs font-medium text-primary-600">Material total<input type="number" value={draft.materialTotal || ""} onChange={(event) => setDraft({ ...draft, materialTotal: event.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-primary-600">Delivery<input type="number" value={draft.deliveryFee || ""} onChange={(event) => setDraft({ ...draft, deliveryFee: event.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-primary-600">Services<input type="number" value={draft.serviceTotal || ""} onChange={(event) => setDraft({ ...draft, serviceTotal: event.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-primary-600">Other charges<input type="number" value={draft.otherCharges || ""} onChange={(event) => setDraft({ ...draft, otherCharges: event.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-primary-600">Discount<input type="number" value={draft.discount || ""} onChange={(event) => setDraft({ ...draft, discount: event.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm" /></label></div>
              <div className="grid gap-4 md:grid-cols-2"><label className="text-xs font-medium text-primary-600">Workflow status<select value={draft.workflowStatus || status} onChange={(event) => setDraft({ ...draft, workflowStatus: event.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm">{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-medium text-primary-600">Internal admin notes<textarea value={draft.adminNotes || ""} onChange={(event) => setDraft({ ...draft, adminNotes: event.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm" /></label></div>
              <div className="flex flex-wrap justify-end gap-2"><button onClick={() => void updateQuote()} disabled={updating === quote.id} className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{updating === quote.id ? "Saving…" : "Save quotation"}</button>{status !== "converted_to_order" && <button onClick={() => void updateQuote("convert_to_order")} disabled={updating === quote.id} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Convert to order</button>}</div>
            </div>}
          </div>;
        })}
      </div>
    </div>
  );
}
