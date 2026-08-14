"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

type Service = { id: string; name: string; description: string; pricing_model: "flat" | "per_sqm"; price: number; unit: string; active: number };

const emptyForm = { name: "", description: "", pricingModel: "flat", price: "", unit: "service", active: true };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/services");
    const data = await response.json();
    setServices(data.services || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/admin/services", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: Number(form.price || 0), serviceId: editingId }) });
    setForm(emptyForm); setEditingId(null); await load(); setSaving(false);
  };

  const edit = (service: Service) => setForm({ name: service.name, description: service.description || "", pricingModel: service.pricing_model, price: String(service.price), unit: service.unit || "service", active: !!service.active });
  const remove = async (id: string) => { if (!confirm("Remove this service?")) return; await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" }); await load(); };

  return <div className="min-h-screen bg-primary-50 p-6 lg:p-8"><div className="mb-6"><h1 className="text-2xl font-bold text-primary-900">Services & Charges</h1><p className="mt-1 text-sm text-primary-500">Configure delivery, installation, and other quotation services. Values are used by the estimator.</p></div><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-xl border border-primary-100 bg-white p-5"><h2 className="font-bold text-primary-900">{editingId ? "Edit service" : "Add service"}</h2><div className="mt-4 space-y-4"><label className="block text-sm font-medium text-primary-700">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2" placeholder="Installation" /></label><label className="block text-sm font-medium text-primary-700">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2" rows={3} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-primary-700">Pricing model<select value={form.pricingModel} onChange={(e) => setForm({ ...form, pricingModel: e.target.value as "flat" | "per_sqm" })} className="mt-1 w-full rounded-lg border border-primary-200 bg-white px-3 py-2"><option value="flat">Flat fee</option><option value="per_sqm">Per m²</option></select></label><label className="text-sm font-medium text-primary-700">Price (₱)<input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2" /></label></div><label className="block text-sm font-medium text-primary-700">Unit<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full rounded-lg border border-primary-200 px-3 py-2" placeholder="service or m²" /></label><label className="flex items-center gap-2 text-sm text-primary-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active for customers</label><div className="flex gap-2"><button onClick={() => void save()} disabled={saving} className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving…" : editingId ? "Save changes" : "Add service"}</button>{editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border border-primary-200 px-4 py-2 text-sm">Cancel</button>}</div></div></div><div className="rounded-xl border border-primary-100 bg-white p-5"><h2 className="font-bold text-primary-900">Configured services</h2>{loading ? <p className="mt-5 text-sm text-primary-400">Loading…</p> : <div className="mt-4 divide-y divide-primary-100">{services.length ? services.map((service) => <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold text-primary-900">{service.name} {!service.active && <span className="text-xs text-red-500">(inactive)</span>}</p><p className="text-sm text-primary-500">{service.description || "No description"}</p></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-accent-700">{formatPrice(service.price)} {service.pricing_model === "per_sqm" ? "/m²" : "flat"}</span><button onClick={() => { setEditingId(service.id); edit(service); }} className="text-sm text-primary-700">Edit</button><button onClick={() => void remove(service.id)} className="text-sm text-red-600">Remove</button></div></div>) : <p className="py-6 text-sm text-primary-400">No services configured.</p>}</div>}</div></div></div>;
}
