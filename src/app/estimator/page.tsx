"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, ChevronRight, CircleHelp, MapPin, PackageCheck, Ruler, Truck, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";

type Recommendation = {
  id: string;
  name: string;
  description: string;
  image: string;
  unit: string;
  price: number;
  coveragePerUnit: number;
  wastagePercent: number;
  estimate: { recommendedQuantity: number; materialTotal: number; baseQuantity: number };
};

type Service = { id: string; name: string; description: string; pricingModel: "flat" | "per_sqm"; price: number; unit: string; total?: number };

type DeliveryZone = { id: string; name: string; fee: number; min_order_for_free?: number; estimated_days?: string };

const DISCLAIMER = "This quotation is an estimate based on the information provided. Final quantity, delivery charges, material requirements, and pricing may be confirmed by our team after reviewing your project.";

export default function EstimatorPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useCustomerAuth();
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [area, setArea] = useState("");
  const [projectType, setProjectType] = useState("landscaping");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/delivery").then((response) => response.json()).then((data) => setDeliveryZones(data.zones || [])).catch(() => {});
    const query = new URLSearchParams(window.location.search);
    const incomingArea = query.get("area");
    const incomingMaterial = query.get("material");
    if (incomingArea) setArea(incomingArea);
    if (incomingMaterial) setSelectedProductId(incomingMaterial);
  }, []);

  const computedArea = useMemo(() => {
    const directArea = Number(area);
    if (Number.isFinite(directArea) && directArea > 0) return directArea;
    const parsedLength = Number(length);
    const parsedWidth = Number(width);
    return parsedLength > 0 && parsedWidth > 0 ? parsedLength * parsedWidth : 0;
  }, [area, length, width]);

  const selectedRecommendation = recommendations.find((item) => item.id === selectedProductId) || recommendations[0];
  const currentTotals = estimate?.totals || { materialTotal: selectedRecommendation?.estimate.materialTotal || 0, deliveryFee: 0, serviceTotal: 0, otherCharges: 0, discount: 0, total: selectedRecommendation?.estimate.materialTotal || 0 };
  const activeStep = !estimate ? 1 : selectedRecommendation ? 3 : 2;

  const calculate = async (nextProductId = selectedProductId, nextServiceIds = selectedServiceIds) => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter a valid area, or enter both length and width in meters.");
      return null;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ areaSqm: computedArea, serviceIds: nextServiceIds, selectedProductId: nextProductId, deliveryZoneId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to calculate estimate");
      setRecommendations(data.recommendations || []);
      setServices(data.services || []);
      setEstimate(data);
      if (data.selectedProductId && !nextProductId) setSelectedProductId(data.selectedProductId);
      return data;
    } catch (err: any) {
      setError(err.message || "Unable to calculate estimate");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const chooseMaterial = async (id: string) => {
    setSelectedProductId(id);
    await calculate(id, selectedServiceIds);
  };

  const toggleService = async (id: string) => {
    const next = selectedServiceIds.includes(id) ? selectedServiceIds.filter((item) => item !== id) : [...selectedServiceIds, id];
    setSelectedServiceIds(next);
    await calculate(selectedProductId, next);
  };

  const requestQuotation = async () => {
    if (!selectedRecommendation || !computedArea) { setError("Calculate your estimate and select a material first."); return; }
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingEstimate", JSON.stringify({ areaSqm: computedArea, selectedProductId, selectedServiceIds, projectType, deliveryCity, deliveryZoneId, timeline, notes }));
      router.push("/login?redirect=/estimator");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ productId: selectedRecommendation.id, name: selectedRecommendation.name, quantity: selectedRecommendation.estimate.recommendedQuantity, unit: selectedRecommendation.unit, estimatedUnitPrice: selectedRecommendation.price, totalPrice: selectedRecommendation.estimate.materialTotal, coveragePerUnit: selectedRecommendation.coveragePerUnit }], areaSqm: computedArea, selectedMaterialId: selectedRecommendation.id, services: estimate?.services || [], materialTotal: currentTotals.materialTotal, deliveryFee: currentTotals.deliveryFee, serviceTotal: currentTotals.serviceTotal, otherCharges: currentTotals.otherCharges, discount: currentTotals.discount, total: currentTotals.total, notes, projectType, deliveryCity, timeline, customerName: [user?.firstName, user?.lastName].filter(Boolean).join(" "), customerEmail: user?.email || "", customerPhone: user?.phone || "", projectLocation: deliveryCity, deliveryZoneId, estimateDisclaimer: DISCLAIMER }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit quotation");
      setMessage(`Quotation ${data.quoteNumber} submitted successfully. Our team will review it and contact you.`);
    } catch (err: any) {
      setError(err.message || "Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="min-h-screen bg-stone-50"><section className="bg-slate-950 text-white"><div className="container-custom py-14 sm:py-20"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-emerald-200"><Ruler className="h-4 w-4" /> Project estimator</div><h1 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Plan your materials before you place the order.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">A calm, transparent way to move from project dimensions to material requirements, service options, and a quotation request.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-3">{[[1, "Project area"], [2, "Material & services"], [3, "Your quotation"]].map(([number, label]) => <div key={number} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${activeStep >= Number(number) ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${activeStep >= Number(number) ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300"}`}>{activeStep > Number(number) ? <Check className="h-4 w-4" /> : number}</span><span className="text-sm font-medium text-slate-200">{label}</span></div>)}</div></div></section>

    <section className="container-custom -mt-8 pb-20"><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Step 01</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Tell us about your space</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Ruler className="h-5 w-5" /></div></div><p className="mt-3 text-sm leading-6 text-slate-500">Use dimensions for a quick calculation, or enter your total area if you already know it.</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Length (m)<input type="number" min="0" value={length} onChange={(event) => setLength(event.target.value)} placeholder="e.g. 10" className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label><label className="text-sm font-medium text-slate-700">Width (m)<input type="number" min="0" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label></div><div className="relative my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.18em] text-slate-400"><div className="h-px flex-1 bg-slate-200" />or<div className="h-px flex-1 bg-slate-200" /></div><label className="text-sm font-medium text-slate-700">Total area (m²)<input type="number" min="0" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Enter square meters directly" className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label><div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center justify-between"><span className="text-sm text-slate-300">Calculated area</span><strong className="text-2xl text-emerald-300">{computedArea ? `${computedArea.toFixed(2)} m²` : "—"}</strong></div><p className="mt-2 text-xs text-slate-400">We use this area to calculate material quantity and any per-m² services.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Project type<select value={projectType} onChange={(event) => setProjectType(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500"><option value="landscaping">Landscaping</option><option value="pathway">Pathway / driveway</option><option value="garden">Garden / decorative</option><option value="construction">Construction</option><option value="other">Other</option></select></label><label className="text-sm font-medium text-slate-700">Delivery location<input value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} placeholder="City or municipality" className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500" /></label></div><label className="mt-4 block text-sm font-medium text-slate-700">Delivery zone<select value={deliveryZoneId} onChange={(event) => { setDeliveryZoneId(event.target.value); if (estimate) void calculate(selectedProductId, selectedServiceIds); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500"><option value="">Select a delivery zone</option>{deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {formatPrice(zone.fee)}{zone.min_order_for_free ? ` · free over ${formatPrice(zone.min_order_for_free)}` : ""}</option>)}</select></label><label className="mt-4 block text-sm font-medium text-slate-700">Preferred schedule<input value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="e.g. Within 2 weeks" className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500" /></label><label className="mt-4 block text-sm font-medium text-slate-700">Additional requirements<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Access details, preferred color, delivery notes, or other requirements" className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-emerald-500" /></label><Button size="lg" className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => void calculate()} disabled={loading}>{loading ? "Calculating…" : "Calculate material requirements"}<ArrowRight className="ml-2 h-5 w-5" /></Button>{error && <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}{message && <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}</div>

      <div className="space-y-6"><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Step 02</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Choose your material</h2></div><PackageCheck className="h-6 w-6 text-emerald-700" /></div><p className="mt-2 text-sm leading-6 text-slate-500">Recommendations appear when a product has a real coverage rate configured by the administrator.</p>{!recommendations.length ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-8 text-center"><PackageCheck className="mx-auto h-9 w-9 text-slate-400" /><p className="mt-3 font-medium text-slate-700">{estimate ? "No configured materials yet" : "Your material options will appear here"}</p><p className="mt-2 text-sm leading-6 text-slate-500">{estimate ? "An administrator must set coverage per unit and enable products for estimation." : "Enter an area and calculate to compare materials."}</p></div> : <div className="mt-6 grid gap-4">{recommendations.map((item) => { const isSelected = selectedRecommendation?.id === item.id; return <button key={item.id} onClick={() => void chooseMaterial(item.id)} className={`group w-full rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${isSelected ? "border-emerald-500 bg-emerald-50/70" : "border-slate-200 bg-white hover:border-emerald-200"}`}><div className="flex gap-4"><div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <span className="text-3xl text-slate-400">◈</span>}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{item.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{item.description}</p></div>{isSelected && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="h-4 w-4" /></span>}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{item.coveragePerUnit} m²/{item.unit}</span><span>{item.wastagePercent}% wastage</span><span>{formatPrice(item.price)}/{item.unit}</span></div></div></div><div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-200/80 pt-3"><div><p className="text-xs text-slate-500">Estimated requirement</p><p className="text-xl font-bold text-slate-950">{item.estimate.recommendedQuantity} {item.unit}</p></div><div className="text-right"><p className="text-xs text-slate-500">Material estimate</p><p className="font-semibold text-emerald-800">{formatPrice(item.estimate.materialTotal)}</p></div></div></button>; })}</div>}</section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Step 03</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Choose your services</h2></div><Wrench className="h-6 w-6 text-emerald-700" /></div><p className="mt-2 text-sm leading-6 text-slate-500">Select cards to include delivery or installation in your estimate.</p>{!services.length ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-6 text-center"><p className="font-medium text-slate-700">No services configured yet</p><p className="mt-1 text-sm text-slate-500">You can still request a material-only quotation.</p></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">{services.map((service) => { const active = selectedServiceIds.includes(service.id); return <button key={service.id} onClick={() => void toggleService(service.id)} className={`rounded-2xl border-2 p-4 text-left transition ${active ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200"}`}><div className="flex items-start justify-between gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-emerald-600 text-white" : "bg-stone-100 text-slate-500"}`}>{service.name.toLowerCase().includes("delivery") ? <Truck className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}</div>{active && <CheckCircle2 className="h-5 w-5 text-emerald-700" />}</div><h3 className="mt-4 font-semibold text-slate-950">{service.name}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{service.description || "Configured service option"}</p><p className="mt-4 text-sm font-semibold text-emerald-800">{formatPrice(service.total || service.price)}{service.pricingModel === "per_sqm" ? " / m²" : ""}</p></button>; })}</div>}</section>

      <section className="sticky top-24 rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Step 04</p><h2 className="mt-2 text-2xl font-semibold">Your quotation summary</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></div></div><div className="mt-7 space-y-4 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-400">Project area</span><strong>{computedArea ? `${computedArea.toFixed(2)} m²` : "—"}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-400">Recommended material</span><strong className="max-w-[55%] text-right">{selectedRecommendation?.name || "—"}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-400">Estimated quantity</span><strong>{selectedRecommendation ? `${selectedRecommendation.estimate.recommendedQuantity} ${selectedRecommendation.unit}` : "—"}</strong></div><div className="border-t border-white/10 pt-4"><div className="flex justify-between py-1"><span className="text-slate-400">Materials</span><span>{formatPrice(currentTotals.materialTotal)}</span></div><div className="flex justify-between py-1"><span className="text-slate-400">Delivery</span><span>{formatPrice(currentTotals.deliveryFee)}</span></div><div className="flex justify-between py-1"><span className="text-slate-400">Services</span><span>{formatPrice(currentTotals.serviceTotal)}</span></div><div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4"><span className="text-slate-300">Estimated total</span><strong className="text-3xl font-semibold text-emerald-300">{formatPrice(currentTotals.total)}</strong></div></div></div><p className="mt-6 text-xs leading-6 text-slate-400">{DISCLAIMER}</p><Button size="lg" className="mt-6 w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300" onClick={requestQuotation} disabled={submitting}>{submitting ? "Submitting…" : isAuthenticated ? "Request this quotation" : "Sign in to request quotation"}<ArrowRight className="ml-2 h-5 w-5" /></Button><div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><MapPin className="h-4 w-4" /> Your final quotation is reviewed by our team.</div></section></div></div></section></main>;
}
