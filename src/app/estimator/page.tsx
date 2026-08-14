"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  estimate: {
    recommendedQuantity: number;
    materialTotal: number;
    baseQuantity: number;
  };
};

type Service = {
  id: string;
  name: string;
  description: string;
  pricingModel: "flat" | "per_sqm";
  price: number;
  unit: string;
  total?: number;
};

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
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
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
  }, []);

  const computedArea = useMemo(() => {
    const directArea = Number(area);
    if (Number.isFinite(directArea) && directArea > 0) return directArea;
    const l = Number(length);
    const w = Number(width);
    return l > 0 && w > 0 ? l * w : 0;
  }, [area, length, width]);

  const selectedRecommendation = recommendations.find((item) => item.id === selectedProductId) || recommendations[0];
  const currentTotals = estimate?.totals || {
    materialTotal: selectedRecommendation?.estimate.materialTotal || 0,
    deliveryFee: 0,
    serviceTotal: 0,
    otherCharges: 0,
    discount: 0,
    total: selectedRecommendation?.estimate.materialTotal || 0,
  };

  const calculate = async () => {
    setError("");
    setMessage("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter a valid area, or enter both length and width in meters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaSqm: computedArea, serviceIds: selectedServiceIds, selectedProductId, deliveryZoneId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to calculate estimate");
      setRecommendations(data.recommendations || []);
      setServices(data.services || []);
      setEstimate(data);
      if (data.selectedProductId) setSelectedProductId(data.selectedProductId);
      if (!data.recommendations?.length) {
        setMessage("No materials are configured for estimation yet. An administrator must add coverage per unit and enable estimation for products.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to calculate estimate");
    } finally {
      setLoading(false);
    }
  };

  const recalculate = async (nextProductId = selectedProductId, nextServiceIds = selectedServiceIds) => {
    if (!computedArea) return;
    const response = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ areaSqm: computedArea, serviceIds: nextServiceIds, selectedProductId: nextProductId }),
    });
    const data = await response.json();
    if (response.ok) setEstimate(data);
  };

  const chooseMaterial = (id: string) => {
    setSelectedProductId(id);
    void recalculate(id, selectedServiceIds);
  };

  const toggleService = (id: string) => {
    const next = selectedServiceIds.includes(id) ? selectedServiceIds.filter((item) => item !== id) : [...selectedServiceIds, id];
    setSelectedServiceIds(next);
    void recalculate(selectedProductId, next);
  };

  const requestQuotation = async () => {
    if (!selectedRecommendation || !computedArea) {
      setError("Calculate your estimate and select a material first.");
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingEstimate", JSON.stringify({ areaSqm: computedArea, selectedProductId, selectedServiceIds,           projectType, deliveryCity, deliveryZoneId, timeline, notes }));
      router.push("/login?redirect=/estimator");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            productId: selectedRecommendation.id,
            name: selectedRecommendation.name,
            quantity: selectedRecommendation.estimate.recommendedQuantity,
            unit: selectedRecommendation.unit,
            estimatedUnitPrice: selectedRecommendation.price,
            totalPrice: selectedRecommendation.estimate.materialTotal,
            coveragePerUnit: selectedRecommendation.coveragePerUnit,
          }],
          areaSqm: computedArea,
          selectedMaterialId: selectedRecommendation.id,
          services: estimate?.services || [],
          materialTotal: currentTotals.materialTotal,
          deliveryFee: currentTotals.deliveryFee,
          serviceTotal: currentTotals.serviceTotal,
          otherCharges: currentTotals.otherCharges,
          discount: currentTotals.discount,
          total: currentTotals.total,
          notes,
          projectType,
          deliveryCity,
          timeline,
          customerName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          customerEmail: user?.email || "",
          customerPhone: user?.phone || "",
          projectLocation: deliveryCity,
          deliveryZoneId,
          estimateDisclaimer: DISCLAIMER,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit quotation");
      setMessage(`Quotation ${data.quoteNumber} submitted successfully. Our team will review it and contact you.`);
    } catch (err: any) {
      setError(err.message || "Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary-50/60 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="max-w-3xl mb-10">
          <span className="inline-flex rounded-full bg-accent-500/10 px-3 py-1 text-sm font-semibold text-accent-700">Quotation & Material Estimator</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-primary-900">Calculate your material requirements</h1>
          <p className="mt-3 text-primary-600">Enter your project area to see configured material recommendations, estimated quantities, service costs, and a quotation summary.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary-900">1. Project information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Length (meters)" id="estimate-length" type="number" min="0" value={length} onChange={(event) => setLength(event.target.value)} placeholder="Optional" />
              <Input label="Width (meters)" id="estimate-width" type="number" min="0" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="Optional" />
            </div>
            <div className="mt-4">
              <Input label="Area (m²)" id="estimate-area" type="number" min="0" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Enter square meters directly" />
              <p className="mt-1 text-xs text-primary-500">Calculated area: <strong>{computedArea ? computedArea.toFixed(2) : "0.00"} m²</strong></p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-primary-700" htmlFor="project-type">Project type</label>
                <select id="project-type" value={projectType} onChange={(event) => setProjectType(event.target.value)} className="w-full rounded-lg border border-primary-200 px-3 py-2.5 text-sm">
                  <option value="landscaping">Landscaping</option><option value="pathway">Pathway / driveway</option><option value="garden">Garden / decorative</option><option value="construction">Construction</option><option value="other">Other</option>
                </select>
              </div>
              <div><Input label="Delivery location" id="estimate-city" value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} placeholder="City or municipality" /></div>
              <div><label className="mb-1 block text-sm font-medium text-primary-700" htmlFor="estimate-zone">Delivery zone</label><select id="estimate-zone" value={deliveryZoneId} onChange={(event) => { setDeliveryZoneId(event.target.value); void recalculate(selectedProductId, selectedServiceIds); }} className="w-full rounded-lg border border-primary-200 px-3 py-2.5 text-sm"><option value="">Select a delivery zone</option>{deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {formatPrice(zone.fee)}{zone.min_order_for_free ? ` free over ${formatPrice(zone.min_order_for_free)}` : ""}</option>)}</select></div>
            </div>
            <div className="mt-4"><Input label="Preferred schedule" id="estimate-timeline" value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="e.g. Within 2 weeks" /></div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-primary-700" htmlFor="estimate-notes">Additional requirements</label>
              <textarea id="estimate-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full rounded-lg border border-primary-200 px-3 py-2.5 text-sm" placeholder="Access details, preferred color, delivery notes, or other requirements" />
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={calculate} disabled={loading}>{loading ? "Calculating…" : "Calculate requirements"}</Button>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p className="mt-4 rounded-lg bg-accent-50 p-3 text-sm text-accent-800">{message}</p>}
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-primary-900">2. Recommended materials</h2>
              <p className="mt-1 text-sm text-primary-500">Recommendations use only products configured by your administrator with a coverage rate.</p>
              {!recommendations.length ? <div className="mt-6 rounded-xl bg-primary-50 p-8 text-center text-sm text-primary-500">Enter your area and calculate to see available materials.</div> : <div className="mt-5 grid gap-4">
                {recommendations.map((item) => <div key={item.id} className={`rounded-xl border-2 p-4 transition ${selectedRecommendation?.id === item.id ? "border-accent-500 bg-accent-50/40" : "border-primary-100"}`}>
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-3xl">💎</div>
                    <div className="min-w-0 flex-1"><h3 className="font-bold text-primary-900">{item.name}</h3><p className="mt-1 line-clamp-2 text-xs text-primary-500">{item.description}</p><p className="mt-2 text-xs text-primary-600">Coverage: {item.coveragePerUnit} m²/{item.unit} · Wastage: {item.wastagePercent}%</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-primary-600">Estimated quantity</p><p className="text-lg font-bold text-primary-900">{item.estimate.recommendedQuantity} {item.unit}</p><p className="text-xs text-primary-500">{formatPrice(item.price)} / {item.unit} · {formatPrice(item.estimate.materialTotal)} estimated</p></div><Button size="sm" variant={selectedRecommendation?.id === item.id ? "primary" : "outline"} onClick={() => chooseMaterial(item.id)}>{selectedRecommendation?.id === item.id ? "Selected" : "Select material"}</Button></div>
                </div>)}
              </div>}
            </div>

            <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-primary-900">3. Services</h2>
              <p className="mt-1 text-sm text-primary-500">Choose any configured service. Per-square-meter services use your entered area.</p>
              {!services.length ? <p className="mt-5 rounded-lg bg-primary-50 p-4 text-sm text-primary-500">No services have been configured yet. You can still request a material-only quotation.</p> : <div className="mt-4 space-y-3">{services.map((service) => <label key={service.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-primary-100 p-3"><span className="flex items-start gap-3"><input type="checkbox" checked={selectedServiceIds.includes(service.id)} onChange={() => toggleService(service.id)} className="mt-1" /><span><strong className="block text-sm text-primary-900">{service.name}</strong><span className="text-xs text-primary-500">{service.description}</span></span></span><span className="text-sm font-semibold text-accent-700">{formatPrice(service.total || service.price)}{service.pricingModel === "per_sqm" ? "/m²" : ""}</span></label>)}</div>}
            </div>

            <div className="rounded-2xl bg-primary-900 p-6 text-white shadow-lg">
              <h2 className="text-xl font-bold">Quotation summary</h2>
              <div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span>Project area</span><strong>{computedArea ? `${computedArea.toFixed(2)} m²` : "—"}</strong></div><div className="flex justify-between"><span>Selected material</span><strong>{selectedRecommendation?.name || "—"}</strong></div><div className="flex justify-between"><span>Material estimate</span><strong>{formatPrice(currentTotals.materialTotal)}</strong></div><div className="flex justify-between"><span>Delivery</span><strong>{formatPrice(currentTotals.deliveryFee)}</strong></div><div className="flex justify-between"><span>Services</span><strong>{formatPrice(currentTotals.serviceTotal)}</strong></div><div className="border-t border-white/20 pt-3 flex justify-between text-lg"><span>Estimated total</span><strong className="text-accent-300">{formatPrice(currentTotals.total)}</strong></div></div>
              <p className="mt-5 text-xs leading-relaxed text-primary-200">{DISCLAIMER}</p>
              <Button size="lg" className="mt-5 w-full" onClick={requestQuotation} disabled={submitting}>{submitting ? "Submitting…" : isAuthenticated ? "Request this quotation" : "Sign in to request quotation"}</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
