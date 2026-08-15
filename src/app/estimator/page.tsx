"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, CircleHelp, Loader2, MapPin, PackageCheck, Ruler, Sparkles, Truck, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";

type ProjectProfile = {
  projectType: string;
  useCase: string;
  loadRequirement: "light" | "medium" | "heavy";
  surfaceType: "soil" | "concrete" | "existing-gravel" | "mixed";
  drainagePriority: "low" | "medium" | "high";
  style: string;
  colorPreference: string;
  maintenance: "low" | "medium" | "high";
  indoorOutdoor: "indoor" | "outdoor" | "both";
  budget: "economy" | "standard" | "premium";
};

type Recommendation = { id: string; name: string; description: string; image: string; unit: string; price: number; coveragePerUnit: number; wastagePercent: number; matchReasons?: string[]; estimate: { recommendedQuantity: number; materialTotal: number; baseQuantity: number } };
type Service = { id: string; name: string; description: string; pricingModel: "flat" | "per_sqm"; price: number; unit: string; total?: number };
type DeliveryZone = { id: string; name: string; fee: number; min_order_for_free?: number; estimated_days?: string };
type QuestionKey = keyof ProjectProfile;

const INITIAL_PROFILE: ProjectProfile = { projectType: "", useCase: "", loadRequirement: "medium", surfaceType: "soil", drainagePriority: "medium", style: "", colorPreference: "any", maintenance: "medium", indoorOutdoor: "outdoor", budget: "standard" };
const QUESTIONS: { key: QuestionKey; title: string; help: string; options: { value: string; label: string; description: string }[] }[] = [
  { key: "projectType", title: "What are you building?", help: "This helps us distinguish between decorative, access, walls, and structural needs.", options: [{ value: "landscaping", label: "Landscape feature", description: "Garden beds, borders, accents" }, { value: "garden", label: "Garden area", description: "Planting beds and outdoor spaces" }, { value: "pathway", label: "Walkway or patio", description: "Pedestrian paths and sitting areas" }, { value: "driveway", label: "Driveway or parking", description: "Vehicle access and parking" }, { value: "drainage", label: "Drainage or erosion", description: "Runoff, slopes, and water control" }, { value: "construction", label: "Construction base", description: "A stable base or fill application" }, { value: "other", label: "Other / Custom project", description: "Fixing walls, retaining structures, or custom builds" }] },
  { key: "useCase", title: "What will the material do?", help: "Choose the main job so we can prioritize the right performance characteristics.", options: [{ value: "decorative", label: "Add a decorative finish", description: "Color, texture, and visual appeal" }, { value: "planting-bed", label: "Cover a planting bed", description: "A neat, low-maintenance garden surface" }, { value: "walkway-base", label: "Support foot traffic", description: "A practical walking surface or base" }, { value: "driveway-base", label: "Support vehicles", description: "A stronger base for cars or access" }, { value: "drainage", label: "Improve drainage", description: "Help water move through the area" }, { value: "erosion-control", label: "Control erosion", description: "Protect soil and exposed slopes" }] },
  { key: "loadRequirement", title: "How much traffic or load will it receive?", help: "A driveway needs a different material profile than a decorative garden border.", options: [{ value: "light", label: "Light use", description: "Decorative areas or occasional walking" }, { value: "medium", label: "Regular foot traffic", description: "Paths, patios, and everyday use" }, { value: "heavy", label: "Vehicles or heavy loads", description: "Driveways, parking, or equipment" }] },
  { key: "surfaceType", title: "What surface are you starting from?", help: "The existing base affects preparation and the material system we recommend.", options: [{ value: "soil", label: "Soil or garden bed", description: "Natural ground or planting soil" }, { value: "concrete", label: "Concrete or slab", description: "An existing hard surface" }, { value: "existing-gravel", label: "Existing gravel", description: "A previous aggregate base" }, { value: "mixed", label: "Mixed or unsure", description: "Different surfaces across the project" }] },
  { key: "drainagePriority", title: "How important is drainage?", help: "Tell us whether managing rainwater is a key part of the project.", options: [{ value: "low", label: "Not a major concern", description: "The area already drains well" }, { value: "medium", label: "Some attention needed", description: "We want a practical solution" }, { value: "high", label: "High priority", description: "Water pooling or runoff is a concern" }] },
  { key: "style", title: "Which look are you aiming for?", help: "Style helps us rank materials with a finish and texture that fit the space.", options: [{ value: "natural", label: "Natural", description: "Organic, earthy, and relaxed" }, { value: "modern", label: "Modern", description: "Clean lines and contemporary contrast" }, { value: "rustic", label: "Rustic", description: "Warm, textured, and traditional" }, { value: "tropical", label: "Tropical", description: "Lush, bright, and garden-focused" }, { value: "clean", label: "Clean and simple", description: "Neat, minimal, and easy to maintain" }] },
  { key: "colorPreference", title: "Do you have a color preference?", help: "Choose any if you would rather let the available inventory guide you.", options: [{ value: "any", label: "Open to options", description: "Show the best available matches" }, { value: "neutral", label: "Neutral", description: "Soft gray, beige, or balanced tones" }, { value: "white", label: "Light or white", description: "Bright, clean, and reflective" }, { value: "dark", label: "Dark or charcoal", description: "Strong contrast and modern depth" }, { value: "warm", label: "Warm earth tones", description: "Tan, brown, terracotta, or golden" }, { value: "mixed", label: "Mixed colors", description: "Natural variation and visual texture" }] },
  { key: "maintenance", title: "How much maintenance do you prefer?", help: "This helps balance appearance with long-term upkeep.", options: [{ value: "low", label: "Keep it low", description: "Minimal refreshing and maintenance" }, { value: "medium", label: "Some upkeep is fine", description: "A balance of appearance and effort" }, { value: "high", label: "I enjoy maintaining it", description: "Prioritize detail and visual control" }] },
  { key: "indoorOutdoor", title: "Where will the material be used?", help: "Some materials are better suited to weather exposure or indoor display.", options: [{ value: "outdoor", label: "Outdoor", description: "Garden, yard, path, or driveway" }, { value: "indoor", label: "Indoor", description: "Interior feature or display" }, { value: "both", label: "Indoor and outdoor", description: "I want a flexible material" }] },
  { key: "budget", title: "What is your starting budget?", help: "This filters the ranking without preventing you from seeing other available options.", options: [{ value: "economy", label: "Economy", description: "Prioritize practical value" }, { value: "standard", label: "Standard", description: "Balance cost and finish" }, { value: "premium", label: "Premium", description: "Prioritize finish and presentation" }] },
];

const DISCLAIMER = "This quotation is an estimate based on the information provided. Final quantity, delivery charges, material requirements, and pricing may be confirmed by our team after reviewing your project.";

export default function EstimatorPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useCustomerAuth();
  const [length, setLength] = useState(""); const [width, setWidth] = useState(""); const [area, setArea] = useState("");
  const [depthCm, setDepthCm] = useState("5");
  const [customProject, setCustomProject] = useState("");
  const [deliveryCity, setDeliveryCity] = useState(""); const [deliveryZoneId, setDeliveryZoneId] = useState(""); const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]); const [timeline, setTimeline] = useState(""); const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState<ProjectProfile>(INITIAL_PROFILE); const [questionnaireOpen, setQuestionnaireOpen] = useState(false); const [questionIndex, setQuestionIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]); const [services, setServices] = useState<Service[]>([]); const [selectedProductId, setSelectedProductId] = useState(""); const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]); const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/delivery").then((response) => response.json()).then((data) => setDeliveryZones(data.zones || [])).catch(() => {});
    const query = new URLSearchParams(window.location.search);
    if (query.get("area")) setArea(query.get("area") || "");
    if (query.get("depth")) setDepthCm(query.get("depth") || "5");
    if (query.get("material")) setSelectedProductId(query.get("material") || "");
  }, []);

  const computedArea = useMemo(() => {
    const direct = Number(area);
    const base = direct > 0 ? direct : (Number(length) > 0 && Number(width) > 0 ? Number(length) * Number(width) : 0);
    const depthFactor = (Number(depthCm) || 5) / 5;
    return base > 0 ? base * depthFactor : 0;
  }, [area, length, width, depthCm]);

  const selectedRecommendation = recommendations.find((item) => item.id === selectedProductId) || recommendations[0];
  const currentTotals = estimate?.totals || { materialTotal: selectedRecommendation?.estimate.materialTotal || 0, deliveryFee: 0, serviceTotal: 0, otherCharges: 0, discount: 0, total: selectedRecommendation?.estimate.materialTotal || 0 };
  const profileComplete = QUESTIONS.every((question) => Boolean(profile[question.key]));
  const activeStep = questionnaireOpen ? 2 : estimate ? 3 : 1;

  const calculate = async (nextProductId = selectedProductId, nextServiceIds = selectedServiceIds, nextProfile = profile) => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter a valid area, or enter both length and width in meters.");
      return null;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaSqm: computedArea,
          serviceIds: nextServiceIds,
          selectedProductId: nextProductId,
          deliveryZoneId,
          projectProfile: { ...nextProfile, projectType: nextProfile.projectType === "other" && customProject ? `other: ${customProject}` : nextProfile.projectType }
        }),
      });
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

  const startQuestionnaire = () => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter your project dimensions first, then we will ask a few questions to match materials.");
      return;
    }
    setQuestionnaireOpen(true);
    setQuestionIndex(0);
  };

  const chooseAnswer = async (value: string) => {
    const question = QUESTIONS[questionIndex];
    const updated = { ...profile, [question.key]: value };
    setProfile(updated);
    setError("");

    if (value === "other" && question.key === "projectType") {
      return;
    }

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((current) => current + 1);
    } else {
      setQuestionnaireOpen(false);
      await calculate(selectedProductId, selectedServiceIds, updated);
    }
  };

  const nextQuestion = async () => {
    const question = QUESTIONS[questionIndex];
    if (!profile[question.key]) {
      setError("Choose an answer so we can make a useful recommendation.");
      return;
    }
    if (question.key === "projectType" && profile.projectType === "other" && !customProject) {
      setError("Please specify what you are building.");
      return;
    }
    setError("");
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    setQuestionnaireOpen(false);
    await calculate(selectedProductId, selectedServiceIds, profile);
  };

  const chooseMaterial = async (id: string) => { setSelectedProductId(id); await calculate(id, selectedServiceIds, profile); };
  const toggleService = async (id: string) => { const next = selectedServiceIds.includes(id) ? selectedServiceIds.filter((item) => item !== id) : [...selectedServiceIds, id]; setSelectedServiceIds(next); await calculate(selectedProductId, next, profile); };

  const requestQuotation = async () => {
    if (!selectedRecommendation || !computedArea) { setError("Complete the project questions and select a material first."); return; }
    if (!isAuthenticated) { sessionStorage.setItem("pendingEstimate", JSON.stringify({ areaSqm: computedArea, depthCm, selectedProductId, selectedServiceIds, projectProfile: profile, deliveryCity, deliveryZoneId, timeline, notes })); router.push("/login?redirect=/estimator"); return; }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: selectedRecommendation.id, name: selectedRecommendation.name, quantity: selectedRecommendation.estimate.recommendedQuantity, unit: selectedRecommendation.unit, estimatedUnitPrice: selectedRecommendation.price, totalPrice: selectedRecommendation.estimate.materialTotal, coveragePerUnit: selectedRecommendation.coveragePerUnit }],
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
          projectType: profile.projectType === "other" && customProject ? `other: ${customProject}` : profile.projectType,
          deliveryCity,
          timeline,
          projectLocation: deliveryCity,
          deliveryZoneId,
          projectDetails: { projectProfile: profile, depthCm, useCase: profile.useCase, loadRequirement: profile.loadRequirement, surfaceType: profile.surfaceType, drainagePriority: profile.drainagePriority, style: profile.style, colorPreference: profile.colorPreference, maintenance: profile.maintenance, indoorOutdoor: profile.indoorOutdoor, budget: profile.budget },
          customerName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          customerEmail: user?.email || "",
          customerPhone: user?.phone || "",
          estimateDisclaimer: DISCLAIMER
        })
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

  const question = QUESTIONS[questionIndex];
  return (
    <main className="min-h-screen bg-stone-50">
      <section className="bg-slate-950 text-white">
        <div className="container-custom py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-emerald-200"><Sparkles className="h-4 w-4" /> Guided project estimator</div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Answer a few project questions. Get a smarter material shortlist.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">We use your area, depth, intended use, traffic, drainage, style, maintenance, and budget to rank materials that are active and available in your inventory.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[[1, "Project area & depth"], [2, "Project questions"], [3, "Material shortlist"]].map(([number, label]) => (
              <div key={number} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${activeStep >= Number(number) ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${activeStep >= Number(number) ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300"}`}>{activeStep > Number(number) ? <Check className="h-4 w-4" /> : number}</span>
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-custom py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">01. Enter area and application depth</h2>
              <p className="mt-2 text-sm text-slate-600">Provide your project dimensions. Depth (thickness) helps scale volume accurately for gravel, base courses, and aggregates.</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">Length (m)<input type="number" min="0" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 10" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label>
                <label className="text-sm font-medium text-slate-700">Width (m)<input type="number" min="0" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label>
                <label className="text-sm font-medium text-slate-700" title="Thickness/height in cm">Depth (cm)<input type="number" min="1" max="100" value={depthCm} onChange={(e) => setDepthCm(e.target.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label>
              </div>
              <div className="mt-4"><label className="text-sm font-medium text-slate-700">Or enter total area (m²)<input type="number" min="0" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Direct area input" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label><p className="mt-2 text-xs text-slate-500">Effective calculation area: <strong className="text-emerald-700">{computedArea ? `${computedArea.toFixed(2)} m²` : "—"}</strong></p></div>

              <Button onClick={startQuestionnaire} size="lg" className="mt-6 w-full bg-slate-950 text-white hover:bg-slate-900">Start project questionnaire <ArrowRight className="ml-2 h-4 w-4" /></Button>
              {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            </div>

            {questionnaireOpen && (
              <div className="rounded-3xl border border-emerald-300 bg-emerald-950 p-7 text-white shadow-xl animate-[slideDown_.4s_ease-out]">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[.15em] text-emerald-200">
                  <span>Question {questionIndex + 1} of {QUESTIONS.length}</span>
                  <span>{Math.round(((questionIndex + 1) / QUESTIONS.length) * 100)}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} /></div>
                <h3 className="mt-6 text-2xl font-semibold">{question.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{question.help}</p>

                <div className="mt-6 grid gap-2.5">
                  {question.options.map((option) => (
                    <button type="button" key={option.value} onClick={() => void chooseAnswer(option.value)} className={`rounded-xl border p-3.5 text-left transition ${profile[question.key] === option.value ? "border-emerald-300 bg-emerald-300/20" : "border-white/10 bg-white/5 hover:border-emerald-300/50"}`}>
                      <span className="flex items-center justify-between text-sm font-semibold"><span>{option.label}</span>{profile[question.key] === option.value && <Check className="h-4 w-4 text-emerald-300" />}</span>
                      <span className="mt-1 block text-xs text-slate-300">{option.description}</span>
                    </button>
                  ))}
                </div>

                {question.key === "projectType" && profile.projectType === "other" && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-emerald-200">Please specify what you are building:</label>
                    <input type="text" value={customProject} onChange={(e) => setCustomProject(e.target.value)} placeholder="e.g. Fixing garden wall" className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300" />
                  </div>
                )}

                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => { if (questionIndex === 0) setQuestionnaireOpen(false); else setQuestionIndex((c) => c - 1); }} className="text-sm font-semibold text-slate-300 hover:text-white">Back</button>
                  <button type="button" onClick={() => void nextQuestion()} className="inline-flex items-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300">{questionIndex === QUESTIONS.length - 1 ? "Show my quotation" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">Material Shortlist & Quotation</h3>
              {!estimate ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-10 text-center">
                  <CircleHelp className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-700">Complete dimensions & questions on the left</p>
                  <p className="mt-1 text-sm text-slate-500">Matching inventory items, quantities, and pricing will appear here instantly.</p>
                </div>
              ) : loading ? (
                <div className="mt-10 flex items-center justify-center p-10 text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculating recommendations…</div>
              ) : (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-3">
                    {recommendations.map((item) => (
                      <button type="button" key={item.id} onClick={() => void chooseMaterial(item.id)} className={`rounded-2xl border p-4 text-left transition ${selectedRecommendation?.id === item.id ? "border-emerald-600 bg-emerald-50/50 shadow-sm" : "border-slate-200 hover:border-emerald-300"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-950">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-600">{item.coveragePerUnit} m²/{item.unit} · {item.wastagePercent}% wastage · <strong className="text-emerald-700">{item.estimate.recommendedQuantity} {item.unit}</strong> recommended</p>
                            {item.matchReasons?.length ? <p className="mt-2 text-xs font-medium text-emerald-800">{item.matchReasons.join(" · ")}</p> : null}
                          </div>
                          <p className="text-base font-bold text-slate-950">{formatPrice(item.estimate.materialTotal)}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <label className="block text-sm font-semibold text-slate-800">Select delivery zone</label>
                    <select value={deliveryZoneId} onChange={(e) => { setDeliveryZoneId(e.target.value); if (estimate) void calculate(selectedProductId, selectedServiceIds, profile); }} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <option value="">Select later</option>
                      {deliveryZones.map((z) => <option key={z.id} value={z.id}>{z.name} · {formatPrice(z.fee)}</option>)}
                    </select>

                    <label className="mt-4 block text-sm font-semibold text-slate-800">Delivery city or project location</label>
                    <input type="text" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} placeholder="e.g. Lipa City, Batangas" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  </div>

                  {services.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <p className="text-sm font-semibold text-slate-800">Optional project services</p>
                      <div className="mt-3 grid gap-2">
                        {services.map((s) => (
                          <button type="button" key={s.id} onClick={() => void toggleService(s.id)} className={`rounded-xl border p-3 text-left ${selectedServiceIds.includes(s.id) ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}>
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                              <span>{s.name}</span>
                              <span className="text-xs text-emerald-700">{formatPrice(s.price)}{s.pricingModel === "per_sqm" ? "/m²" : ""}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{s.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl bg-slate-950 p-6 text-white">
                    <div className="flex justify-between text-sm text-slate-300"><span>Materials ({selectedRecommendation?.name || "Selected"})</span><span>{formatPrice(currentTotals.materialTotal)}</span></div>
                    <div className="mt-2 flex justify-between text-sm text-slate-300"><span>Delivery</span><span>{formatPrice(currentTotals.deliveryFee)}</span></div>
                    <div className="mt-2 flex justify-between text-sm text-slate-300"><span>Services</span><span>{formatPrice(currentTotals.serviceTotal)}</span></div>
                    <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-bold"><span>Total estimate</span><span className="text-2xl text-emerald-300">{formatPrice(currentTotals.total)}</span></div>

                    <div className="mt-6">
                      <label className="block text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Project notes for quotation</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any specific site instructions or delivery details..." className="mt-2 w-full rounded-xl border border-white/25 bg-white/10 p-3 text-sm text-white outline-none focus:border-emerald-300" rows={2} />
                    </div>

                    <Button onClick={requestQuotation} disabled={submitting} size="lg" className="mt-6 w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300">{submitting ? "Submitting…" : "Request official quotation"} <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    {message && <p className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/20 p-3 text-sm text-emerald-200">{message}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
