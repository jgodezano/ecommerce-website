"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";

type Quote = {
  id: string;
  quote_number: string;
  workflowStatus?: string;
  total: number;
  material_total?: number;
  delivery_fee?: number;
  service_total?: number;
  area_sqm?: number;
  project_location?: string;
  items: any[];
  services: any[];
  created_at: string;
  notes?: string;
};

const statusColors: Record<string, string> = {
  draft: "text-gray-600 bg-gray-100", pending_review: "text-yellow-700 bg-yellow-50", quoted: "text-purple-700 bg-purple-50", approved: "text-green-700 bg-green-50", rejected: "text-red-700 bg-red-50", converted_to_order: "text-blue-700 bg-blue-50", completed: "text-emerald-700 bg-emerald-50", cancelled: "text-gray-600 bg-gray-100",
};

export default function QuotesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push("/login?redirect=/account/quotes"); return; }
    if (isAuthenticated) fetch("/api/quotes").then((res) => res.json()).then((data) => setQuotes(data.quotes || [])).catch(() => {}).finally(() => setLoading(false));
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) return <div className="mx-auto max-w-4xl px-4 py-8 text-center text-primary-400">Loading quotations…</div>;
  if (!isAuthenticated) return null;

  return <div className="mx-auto max-w-5xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-primary-900">My Quotations</h1><p className="mt-1 text-sm text-primary-500">Review estimates submitted for your projects.</p></div><Link href="/estimator"><Button variant="outline" size="sm">Calculate New Estimate</Button></Link></div>{quotes.length === 0 ? <div className="rounded-xl border border-primary-100 bg-white p-12 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-3xl">📄</div><p className="mb-4 text-primary-500">No quotation requests yet.</p><Link href="/estimator" className="text-sm font-medium text-accent-600">Start an estimate →</Link></div> : <div className="space-y-4">{quotes.map((quote) => { const status = quote.workflowStatus || "pending_review"; return <div key={quote.id} className="overflow-hidden rounded-xl border border-primary-100 bg-white"><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><button className="text-left" onClick={() => setExpanded(expanded === quote.id ? null : quote.id)}><div className="flex flex-wrap items-center gap-3"><span className="font-bold text-primary-900">{quote.quote_number}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}>{status.replace(/_/g, " ")}</span></div><p className="mt-1 text-xs text-primary-500">{formatDate(quote.created_at)}{quote.area_sqm ? ` · ${quote.area_sqm} m²` : ""}{quote.project_location ? ` · ${quote.project_location}` : ""}</p></button><div className="flex items-center justify-between gap-4 sm:justify-end"><strong className="text-lg text-primary-900">{formatPrice(quote.total || 0)}</strong><a href={`/api/quotes/${quote.id}/pdf`} className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50">Download PDF</a></div></div>{expanded === quote.id && <div className="space-y-4 border-t border-primary-100 bg-primary-50/50 p-5"><div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Materials</h3><div className="divide-y divide-primary-100 rounded-lg border border-primary-100 bg-white">{(quote.items || []).map((item: any, index: number) => <div key={index} className="flex justify-between px-4 py-3 text-sm"><span>{item.name || item.productName}</span><span>{item.quantity} {item.unit || "unit"} · {formatPrice(item.totalPrice || 0)}</span></div>)}</div></div>{(quote.services || []).length > 0 && <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-500">Services</h3><div className="rounded-lg border border-primary-100 bg-white p-4 text-sm">{quote.services.map((service: any) => <div key={service.id || service.name} className="flex justify-between py-1"><span>{service.name}</span><span>{formatPrice(service.total || service.price || 0)}</span></div>)}</div></div>}<div className="grid gap-2 text-sm sm:grid-cols-3"><div className="rounded-lg bg-white p-3"><span className="block text-xs text-primary-500">Materials</span><strong>{formatPrice(quote.material_total || 0)}</strong></div><div className="rounded-lg bg-white p-3"><span className="block text-xs text-primary-500">Services</span><strong>{formatPrice(quote.service_total || 0)}</strong></div><div className="rounded-lg bg-white p-3"><span className="block text-xs text-primary-500">Estimated total</span><strong className="text-accent-700">{formatPrice(quote.total || 0)}</strong></div></div><p className="text-xs leading-relaxed text-primary-500">This quotation is an estimate. Final quantities, delivery charges, material requirements, and pricing may be confirmed by our team after reviewing your project.</p></div>}</div>; })}</div>}</div>;
}
