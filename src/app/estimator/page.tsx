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
  constructionStage: string;
  constructionMethod: string;
  customProject?: string;
};

type Recommendation = { id: string; name: string; description: string; image: string; unit: string; price: number; coveragePerUnit: number; wastagePercent: number; systemRole?: string; systemRequired?: boolean; purpose?: string; matchReasons?: string[]; estimate: { recommendedQuantity: number; materialTotal: number; baseQuantity: number } };
type Service = { id: string; name: string; description: string; pricingModel: "flat" | "per_sqm"; price: number; unit: string; total?: number; recommended?: boolean; recommendationReason?: string; selected?: boolean };
type DeliveryZone = { id: string; name: string; fee: number; min_order_for_free?: number; estimated_days?: string };
type Question = { key: QuestionKey; title: string; help: string; options: { value: string; label: string; description: string }[]; when?: (profile: ProjectProfile) => boolean };
type QuestionKey = keyof ProjectProfile;
type FollowUpAction = "official_review" | "site_visit";

const INITIAL_PROFILE: ProjectProfile = { projectType: "", useCase: "", loadRequirement: "medium", surfaceType: "soil", drainagePriority: "medium", style: "", colorPreference: "any", maintenance: "medium", indoorOutdoor: "outdoor", budget: "standard", constructionStage: "", constructionMethod: "", customProject: "" };
const STYLE_GUIDANCE: Record<string, string> = {
  natural: "Natural direction: combine earthy tones, irregular textures, and planting-friendly materials. Use this as a starting style, then confirm the final finish on site.",
  modern: "Modern direction: prioritize clean edges, consistent sizing, and neutral or contrasting finishes for a structured look.",
  rustic: "Rustic direction: prioritize warm earth tones, textured surfaces, and materials with natural variation.",
  tropical: "Tropical direction: prioritize durable outdoor finishes, warm accents, and planting-friendly surfaces.",
  clean: "Clean and simple direction: prioritize consistent sizing, restrained colors, and low-maintenance finishes.",
};
const QUESTIONS: Question[] = [
  { key: "projectType", title: "What are you building?", help: "This helps us distinguish between decorative, access, walls, and structural needs.", options: [{ value: "landscaping", label: "Landscape feature", description: "Garden beds, borders, accents" }, { value: "garden", label: "Garden area", description: "Planting beds and outdoor spaces" }, { value: "pathway", label: "Walkway or patio", description: "Pedestrian paths and sitting areas" }, { value: "driveway", label: "Driveway or parking", description: "Vehicle access and parking" }, { value: "drainage", label: "Drainage or erosion", description: "Runoff, slopes, and water control" }, { value: "construction", label: "Construction base", description: "A stable base or fill application" }, { value: "other", label: "Other / Custom project", description: "Fixing walls, retaining structures, or custom builds" }] },
  { key: "useCase", title: "What will the material do?", help: "Choose the main job so we can prioritize the right performance characteristics.", options: [{ value: "repair-fix", label: "Repair or fix existing", description: "Fixing walls, filling cracks, or refreshing an area" }, { value: "build-new", label: "Build something new", description: "Create a new feature, wall, or structure from scratch" }, { value: "decorative", label: "Add decoration / finish", description: "Improve visual appeal, color, and texture" }, { value: "structural", label: "Provide structural support", description: "Base layers, retaining weight, or load-bearing" }, { value: "drainage", label: "Manage drainage or erosion", description: "Water control, runoff, and soil protection" }, { value: "maintenance", label: "Reduce maintenance", description: "Covering soil, suppressing weeds, or easy-care surfaces" }] },
  { key: "loadRequirement", title: "How much traffic or load will it receive?", help: "A driveway needs a different material profile than a decorative garden border.", options: [{ value: "light", label: "Light use", description: "Decorative areas or occasional walking" }, { value: "medium", label: "Regular foot traffic", description: "Paths, patios, and everyday use" }, { value: "heavy", label: "Vehicles or heavy loads", description: "Driveways, parking, or equipment" }] },
  { key: "surfaceType", title: "What surface are you starting from?", help: "The existing base affects preparation and the material system we recommend.", options: [{ value: "soil", label: "Soil or garden bed", description: "Natural ground or planting soil" }, { value: "concrete", label: "Concrete or slab", description: "An existing hard surface" }, { value: "existing-gravel", label: "Existing gravel", description: "A previous aggregate base" }, { value: "mixed", label: "Mixed or unsure", description: "Different surfaces across the project" }] },
  { key: "drainagePriority", title: "How important is drainage?", help: "Tell us whether managing rainwater is a key part of the project.", options: [{ value: "low", label: "Not a major concern", description: "The area already drains well" }, { value: "medium", label: "Some attention needed", description: "We want a practical solution" }, { value: "high", label: "High priority", description: "Water pooling or runoff is a concern" }] },
  { key: "style", title: "Which look are you aiming for?", help: "Style helps us rank materials with a finish and texture that fit the space.", options: [{ value: "natural", label: "Natural", description: "Organic, earthy, and relaxed" }, { value: "modern", label: "Modern", description: "Clean lines and contemporary contrast" }, { value: "rustic", label: "Rustic", description: "Warm, textured, and traditional" }, { value: "tropical", label: "Tropical", description: "Lush, bright, and garden-focused" }, { value: "clean", label: "Clean and simple", description: "Neat, minimal, and easy to maintain" }] },
  { key: "colorPreference", title: "Do you have a color preference?", help: "Choose any if you would rather let the available inventory guide you.", options: [{ value: "any", label: "Open to options", description: "Show the best available matches" }, { value: "neutral", label: "Neutral", description: "Soft gray, beige, or balanced tones" }, { value: "white", label: "Light or white", description: "Bright, clean, and reflective" }, { value: "dark", label: "Dark or charcoal", description: "Strong contrast and modern depth" }, { value: "warm", label: "Warm earth tones", description: "Tan, brown, terracotta, or golden" }, { value: "mixed", label: "Mixed colors", description: "Natural variation and visual texture" }] },
  { key: "maintenance", title: "How much maintenance do you prefer?", help: "This helps balance appearance with long-term upkeep.", options: [{ value: "low", label: "Keep it low", description: "Minimal refreshing and maintenance" }, { value: "medium", label: "Some upkeep is fine", description: "A balance of appearance and effort" }, { value: "high", label: "I enjoy maintaining it", description: "Prioritize detail and visual control" }] },
  { key: "indoorOutdoor", title: "Where will the material be used?", help: "Some materials are better suited to weather exposure or indoor display.", options: [{ value: "outdoor", label: "Outdoor", description: "Garden, yard, path, or driveway" }, { value: "indoor", label: "Indoor", description: "Interior feature or display" }, { value: "both", label: "Indoor and outdoor", description: "I want a flexible material" }] },
  { key: "budget", title: "What is your starting budget?", help: "This filters the ranking without preventing you from seeing other available options.", options: [{ value: "economy", label: "Economy", description: "Prioritize practical value" }, { value: "standard", label: "Standard", description: "Balance cost and finish" }, { value: "premium", label: "Premium", description: "Prioritize finish and presentation" }] },
  { key: "constructionStage", title: "What stage is the project at?", help: "This helps us separate a new build from a repair or improvement.", when: (profile) => ["terrace", "wall", "construction", "other"].includes(profile.projectType) || ["repair-fix", "build-new", "structural"].includes(profile.useCase), options: [{ value: "new", label: "New construction", description: "Starting the structure or feature from scratch" }, { value: "repair", label: "Repair existing", description: "Fixing damage, cracks, or a failed section" }, { value: "improvement", label: "Improve or extend", description: "Upgrading or adding to something already there" }] },
  { key: "constructionMethod", title: "What kind of construction or finish do you need?", help: "If you are unsure, choose the option closest to your idea and we will suggest a practical starting system.", when: (profile) => ["terrace", "wall", "construction"].includes(profile.projectType) || ["build-new", "structural"].includes(profile.useCase), options: [{ value: "foundation", label: "Foundation or concrete base", description: "Footings, slabs, or a stable supporting base" }, { value: "masonry", label: "Wall, block, or retaining work", description: "Masonry, partitions, retaining walls, or repairs" }, { value: "surface", label: "Finished surface or paving", description: "The visible floor, patio, terrace, or walkway finish" }, { value: "unsure", label: "I am not sure", description: "Let the recommendation guide my starting point" }] },
];

const QUESTION_FLOW_KEYS: QuestionKey[] = ["projectType", "useCase", "constructionStage", "constructionMethod", "loadRequirement", "surfaceType", "drainagePriority", "style", "colorPreference", "maintenance", "indoorOutdoor", "budget"];

const DISCLAIMER = "This quotation is an estimate based on the information provided. Final quantity, delivery charges, material requirements, and pricing may be confirmed by our team after reviewing your project.";

export default function EstimatorPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useCustomerAuth();
  const [length, setLength] = useState(""); const [width, setWidth] = useState(""); const [area, setArea] = useState("");
  const [depthCm, setDepthCm] = useState("5");
  const [customProject, setCustomProject] = useState("");
  const [deliveryCity, setDeliveryCity] = useState(""); const [deliveryZoneId, setDeliveryZoneId] = useState(""); const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]); const [timeline, setTimeline] = useState(""); const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState<ProjectProfile>(INITIAL_PROFILE); const [questionnaireOpen, setQuestionnaireOpen] = useState(false); const [editingInputs, setEditingInputs] = useState(true); const [questionIndex, setQuestionIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]); const [services, setServices] = useState<Service[]>([]); const [selectedProductId, setSelectedProductId] = useState(""); const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]); const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false); const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [handoffPending, setHandoffPending] = useState(false); const [submittedQuoteId, setSubmittedQuoteId] = useState(""); const [submittedQuoteNumber, setSubmittedQuoteNumber] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    fetch("/api/delivery").then((response) => response.json()).then((data) => setDeliveryZones(data.zones || [])).catch(() => {});
    const query = new URLSearchParams(window.location.search);
    if (query.get("area")) setArea(query.get("area") || "");
    if (query.get("depth")) setDepthCm(query.get("depth") || "5");
    if (query.get("material")) setSelectedProductId(query.get("material") || "");
    if (query.get("zone")) setDeliveryZoneId(query.get("zone") || "");
    if (query.get("services")) setSelectedServiceIds((query.get("services") || "").split(",").filter(Boolean));
    const profileParam = query.get("profile");
    const pendingParam = !profileParam ? sessionStorage.getItem("pendingEstimate") : null;
    if (profileParam || pendingParam) {
      try {
        const transferred = profileParam ? JSON.parse(profileParam) as Partial<ProjectProfile> : (JSON.parse(pendingParam || "{}")?.projectProfile as Partial<ProjectProfile>);
        const restored = { ...INITIAL_PROFILE, ...transferred };
        const pending = pendingParam ? JSON.parse(pendingParam) : null;
        const restoredDepth = String(profileParam ? (query.get("depth") || "5") : (pending?.depthCm || "5"));
        const restoredArea = Number(profileParam ? (query.get("area") || "0") : (pending?.areaSqm || 0));
        const depthFactor = (Number(restoredDepth) || 5) / 5;
        setArea(restoredArea > 0 ? String(restoredArea / depthFactor) : "");
        setDepthCm(restoredDepth);
        setProfile(restored);
        setCustomProject(String(transferred.customProject || ""));
        if (pending?.selectedProductId) setSelectedProductId(String(pending.selectedProductId));
        if (pending?.selectedServiceIds) setSelectedServiceIds(pending.selectedServiceIds.map(String));
        if (pending?.deliveryCity) setDeliveryCity(String(pending.deliveryCity));
        if (pending?.deliveryZoneId) setDeliveryZoneId(String(pending.deliveryZoneId));
        if (pending?.timeline) setTimeline(String(pending.timeline));
        if (pending?.notes) setNotes(String(pending.notes));
        setEditingInputs(false);
        setQuestionnaireOpen(false);
        setHandoffPending(true);
        if (pendingParam) {
          sessionStorage.removeItem("pendingEstimate");
          setMessage("Your saved estimate was restored. Review the details below, then choose official review or a site visit.");
        }
      } catch {
        setError("The transferred project details could not be read. You can enter them again below.");
      }
    }
  }, []);

  const computedArea = useMemo(() => {
    const direct = Number(area);
    const base = direct > 0 ? direct : (Number(length) > 0 && Number(width) > 0 ? Number(length) * Number(width) : 0);
    const depthFactor = (Number(depthCm) || 5) / 5;
    return base > 0 ? base * depthFactor : 0;
  }, [area, length, width, depthCm]);

  const selectedRecommendation = recommendations.find((item) => item.id === selectedProductId) || recommendations[0];
  const currentTotals = estimate?.totals || { materialTotal: selectedRecommendation?.estimate.materialTotal || 0, deliveryFee: 0, serviceTotal: 0, otherCharges: 0, discount: 0, total: selectedRecommendation?.estimate.materialTotal || 0 };
  const orderedQuestions = QUESTION_FLOW_KEYS.map((key) => QUESTIONS.find((item) => item.key === key)).filter((item): item is Question => Boolean(item));
  const visibleQuestions = orderedQuestions.filter((item) => !item.when || item.when(profile));
  const projectTypeLabel = QUESTIONS[0].options.find((option) => option.value === profile.projectType)?.label || profile.projectType;
  const useCaseLabel = QUESTIONS[1].options.find((option) => option.value === profile.useCase)?.label || profile.useCase;
  const constructionStageLabel = QUESTIONS.find((item) => item.key === "constructionStage")?.options.find((option) => option.value === profile.constructionStage)?.label || profile.constructionStage;
  const constructionMethodLabel = QUESTIONS.find((item) => item.key === "constructionMethod")?.options.find((option) => option.value === profile.constructionMethod)?.label || profile.constructionMethod;
  const styleGuidance = STYLE_GUIDANCE[profile.style] || "Style direction: we will use your answers and available inventory as a practical starting point. Final appearance should be confirmed with a sample or site review.";
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

  useEffect(() => {
    if (!handoffPending || !computedArea || !profile.projectType) return;
    void calculate(selectedProductId, selectedServiceIds, profile).finally(() => setHandoffPending(false));
  }, [handoffPending, computedArea, profile.projectType]);

  const startQuestionnaire = () => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter your project dimensions first, then we will ask a few questions to match materials.");
      return;
    }
    setEditingInputs(false);
    setQuestionnaireOpen(true);
    setQuestionIndex(0);
  };

  const chooseAnswer = async (value: string) => {
    const question = visibleQuestions[questionIndex];
    const updated = { ...profile, [question.key]: value };
    setProfile(updated);
    setError("");

    if (value === "other" && question.key === "projectType") {
      return;
    }

    if (questionIndex < visibleQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
    } else {
      setQuestionnaireOpen(false);
      setEditingInputs(false);
      await calculate(selectedProductId, selectedServiceIds, updated);
    }
  };

  const nextQuestion = async () => {
    const question = visibleQuestions[questionIndex];
    if (!profile[question.key]) {
      setError("Choose an answer so we can make a useful recommendation.");
      return;
    }
    if (question.key === "projectType" && profile.projectType === "other" && !customProject) {
      setError("Please specify what you are building.");
      return;
    }
    setError("");
    if (questionIndex < visibleQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    setQuestionnaireOpen(false);
    setEditingInputs(false);
    await calculate(selectedProductId, selectedServiceIds, profile);
  };

  const chooseMaterial = async (id: string) => { setSelectedProductId(id); await calculate(id, selectedServiceIds, profile); };
  const toggleService = async (id: string) => { const next = selectedServiceIds.includes(id) ? selectedServiceIds.filter((item) => item !== id) : [...selectedServiceIds, id]; setSelectedServiceIds(next); await calculate(selectedProductId, next, profile); };

  const requestQuotation = async (action: FollowUpAction = "official_review") => {
    if (!selectedRecommendation || !computedArea) { setError("Complete the project questions and select a material first."); return; }
    if (!isAuthenticated) {
      const resumePath = `/estimator?area=${encodeURIComponent(computedArea.toString())}&depth=${encodeURIComponent(depthCm || "5")}${selectedRecommendation ? `&material=${encodeURIComponent(selectedRecommendation.id)}` : ""}${deliveryZoneId ? `&zone=${encodeURIComponent(deliveryZoneId)}` : ""}${selectedServiceIds.length ? `&services=${encodeURIComponent(selectedServiceIds.join(","))}` : ""}&profile=${encodeURIComponent(JSON.stringify({ ...profile, customProject }))}`;
      sessionStorage.setItem("pendingEstimate", JSON.stringify({ areaSqm: computedArea, depthCm, selectedProductId, selectedServiceIds, projectProfile: profile, deliveryCity, deliveryZoneId, timeline, notes, followUpAction: action }));
      router.push(`/login?redirect=${encodeURIComponent(resumePath)}`);
      return;
    }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: recommendations.map((item) => ({ productId: item.id, name: item.name, quantity: item.estimate.recommendedQuantity, unit: item.unit, estimatedUnitPrice: item.price, totalPrice: item.estimate.materialTotal, coveragePerUnit: item.coveragePerUnit, systemRole: item.systemRole, purpose: item.purpose })),
          areaSqm: computedArea,
          selectedMaterialId: selectedRecommendation.id,
          services: estimate?.services || [],
          materialTotal: currentTotals.materialTotal,
          deliveryFee: currentTotals.deliveryFee,
          serviceTotal: currentTotals.serviceTotal,
          otherCharges: currentTotals.otherCharges,
          discount: currentTotals.discount,
          total: currentTotals.total,
          notes: action === "site_visit" ? `[SITE VISIT REQUESTED] ${notes}`.trim() : notes,
          projectType: profile.projectType === "other" && customProject ? `other: ${customProject}` : profile.projectType,
          deliveryCity,
          timeline,
          projectLocation: deliveryCity,
          deliveryZoneId,
          projectDetails: { projectProfile: profile, depthCm, useCase: profile.useCase, loadRequirement: profile.loadRequirement, surfaceType: profile.surfaceType, drainagePriority: profile.drainagePriority, style: profile.style, colorPreference: profile.colorPreference, maintenance: profile.maintenance, indoorOutdoor: profile.indoorOutdoor, budget: profile.budget, followUpAction: action },
          customerName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          customerEmail: user?.email || "",
          customerPhone: user?.phone || "",
          estimateDisclaimer: DISCLAIMER
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit quotation");
      setSubmittedQuoteId(data.quoteId || "");
      setSubmittedQuoteNumber(data.quoteNumber || "");
      setMessage(action === "site_visit" ? `Site visit request ${data.quoteNumber} submitted. Our team will confirm the visit details.` : `Quotation ${data.quoteNumber} submitted for official review. Our team will review it and contact you.`);
    } catch (err: any) {
      setError(err.message || "Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const addToQuoteList = async () => {
    if (!selectedRecommendation) return;
    setIsAddingToCart(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMessage(`${selectedRecommendation.name} has been added to your quote list. You can view it in the Quotes section.`);
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError("Unable to add to quote list.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const question = visibleQuestions[questionIndex] || visibleQuestions[0];
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

              {handoffPending ? (
                <div className="mt-6 flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restoring your project summary and quotation…</div>
              ) : estimate && !questionnaireOpen && !editingInputs ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-700">Project summary</p><button type="button" onClick={() => { setEstimate(null); setRecommendations([]); setEditingInputs(true); }} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">Edit details</button></div>
                  <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Project</dt><dd className="text-right font-semibold text-slate-950">{profile.projectType === "other" && customProject ? customProject : projectTypeLabel}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Main need</dt><dd className="text-right font-semibold text-slate-950">{useCaseLabel || "Not specified"}</dd></div>{constructionStageLabel && <div className="flex justify-between gap-4"><dt className="text-slate-500">Stage</dt><dd className="text-right font-semibold text-slate-950">{constructionStageLabel}</dd></div>}{constructionMethodLabel && <div className="flex justify-between gap-4"><dt className="text-slate-500">Construction focus</dt><dd className="text-right font-semibold text-slate-950">{constructionMethodLabel}</dd></div>}<div className="flex justify-between gap-4"><dt className="text-slate-500">Effective area</dt><dd className="text-right font-semibold text-slate-950">{computedArea.toFixed(2)} m² · {depthCm || 5} cm</dd></div></dl>
                </div>
              ) : editingInputs && !questionnaireOpen ? (
                <>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700">Length (m)<input type="number" min="0" step="0.1" value={length} onChange={(e) => setLength(e.target.value)} onInput={(e) => setLength(e.currentTarget.value)} placeholder="e.g. 10" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label>
                    <label className="text-sm font-medium text-slate-700">Width (m)<input type="number" min="0" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} onInput={(e) => setWidth(e.currentTarget.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label>
                    <label className="text-sm font-medium text-slate-700" title="Thickness/height in cm">Depth (cm)<input type="number" min="1" max="100" value={depthCm} onChange={(e) => setDepthCm(e.target.value)} onInput={(e) => setDepthCm(e.currentTarget.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label>
                  </div>
                  <div className="mt-4"><label className="text-sm font-medium text-slate-700">Or enter total area (m²)<input type="number" min="0" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} onInput={(e) => setArea(e.currentTarget.value)} placeholder="Direct area input" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-600" /></label><p className="mt-2 text-xs text-slate-500">Effective calculation area: <strong className="text-emerald-700">{computedArea ? `${computedArea.toFixed(2)} m²` : "—"}</strong></p></div>
                  <Button onClick={startQuestionnaire} size="lg" className="mt-6 w-full bg-slate-950 text-white hover:bg-slate-900">Start project questionnaire <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </>
              ) : null}
              {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            </div>

            {questionnaireOpen && (
              <div className="rounded-3xl border border-emerald-300 bg-emerald-950 p-7 text-white shadow-xl animate-[slideDown_.4s_ease-out]">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[.15em] text-emerald-200">
                  <span>Question {questionIndex + 1} of {visibleQuestions.length}</span>
                  <span>{Math.round(((questionIndex + 1) / visibleQuestions.length) * 100)}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${((questionIndex + 1) / visibleQuestions.length) * 100}%` }} /></div>
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
                  <button type="button" onClick={() => { if (questionIndex === 0) { setQuestionnaireOpen(false); setEditingInputs(true); } else setQuestionIndex((c) => c - 1); }} className="text-sm font-semibold text-slate-300 hover:text-white">Back</button>
                  <button type="button" onClick={() => void nextQuestion()} className="inline-flex items-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300">{questionIndex === visibleQuestions.length - 1 ? "Show my quotation" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">Material System & Quotation</h3>
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
                  {estimate.system && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-700">Recommended material system</p><h4 className="mt-2 text-lg font-semibold text-slate-950">{estimate.system.name}</h4><p className="mt-2 text-sm leading-6 text-emerald-950">{estimate.system.purpose}</p><p className="mt-3 text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">These components are quoted together because each has a different job in the project.</p></div>}
                  <div className="grid gap-3">
                    {recommendations.map((item) => (
                      <button type="button" key={item.id} onClick={() => void chooseMaterial(item.id)} className={`rounded-2xl border p-4 text-left transition ${selectedRecommendation?.id === item.id ? "border-emerald-600 bg-emerald-50/50 shadow-sm" : "border-slate-200 hover:border-emerald-300"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <PackageCheck className="m-4 h-8 w-8 text-slate-400" />}</div><div><p className="font-semibold text-slate-950">{item.name}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-[.12em] text-emerald-700">{item.systemRole || "project material"}{item.systemRequired ? " · required component" : ""}</p></div></div>
                            <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-bold text-emerald-800">{item.estimate.recommendedQuantity}</span><span className="text-sm font-semibold text-emerald-800">{item.unit} estimated</span></div>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{item.purpose || `Based on ${item.coveragePerUnit} m²/${item.unit} coverage and ${item.wastagePercent}% allowance`}</p>
                            {item.matchReasons?.length ? <p className="mt-2 text-xs font-medium text-emerald-800">{item.matchReasons.join(" · ")}</p> : null}
                          </div>
                          <p className="whitespace-nowrap text-base font-bold text-slate-950">{formatPrice(item.estimate.materialTotal)}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><p className="text-xs font-semibold uppercase tracking-[.15em] text-sky-700">Optional style direction</p><p className="mt-2 text-sm leading-6 text-sky-950">{styleGuidance}</p><p className="mt-2 text-xs leading-5 text-sky-800">For repairs and custom work, this is guidance only because the existing site condition and exact finish cannot be verified from the questionnaire.</p></div>

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
                        {services.filter((s) => s.recommended || selectedServiceIds.includes(s.id)).slice(0, 6).map((s) => (
                          <button type="button" key={s.id} onClick={() => void toggleService(s.id)} className={`rounded-xl border p-3 text-left ${selectedServiceIds.includes(s.id) ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}>
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                              <span>{s.name}</span>
                              <span className="text-xs text-emerald-700">{formatPrice(s.price)}{s.pricingModel === "per_sqm" ? "/m²" : ""}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{s.recommendationReason || s.description}</p>
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

                    <div className="mt-6 flex flex-col gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button onClick={() => void requestQuotation("official_review")} disabled={submitting} size="lg" className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">{submitting ? "Submitting…" : "Request official review"} <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        <Button onClick={() => void requestQuotation("site_visit")} disabled={submitting} size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">Request a site visit</Button>
                      </div>
                      <Button onClick={addToQuoteList} disabled={isAddingToCart} variant="outline" className="w-full border-emerald-300/30 bg-white/5 text-emerald-300 hover:bg-white/10">
                        {isAddingToCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                        Add materials to quote list
                      </Button>
                    </div>

                    <div className="mt-8 rounded-2xl bg-white/5 p-6 border border-white/10">
                      <h4 className="font-semibold text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400" /> What happens next?</h4>
                      <ul className="mt-4 space-y-4 text-sm text-slate-300">
                        <li className="flex gap-3"><div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-[10px]">1</div><span><strong>Team Review:</strong> Our consultants will review your project dimensions and material choice to ensure they fit the intended use.</span></li>
                        <li className="flex gap-3"><div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-[10px]">2</div><span><strong>Stock Confirmation:</strong> We check real-time inventory at our Lipa City yard for the exact quantity needed.</span></li>
                        <li className="flex gap-3"><div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-[10px]">3</div><span><strong>Final Quote:</strong> You&apos;ll receive an official PDF quotation with a confirmed delivery schedule and payment instructions.</span></li>
                      </ul>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-400 italic">Use official review for a material and service confirmation. Choose a site visit when the existing conditions, wall, terrace, or repair need to be checked in person.</p>
                    {message && <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/20 p-3 text-sm text-emerald-200"><p>{message}</p>{submittedQuoteId && <div className="mt-3 flex flex-wrap gap-3"><a href="/account/quotes" className="font-semibold underline">Track this request</a><a href={`/api/quotes/${submittedQuoteId}/pdf`} target="_blank" rel="noreferrer" className="font-semibold underline">Download project PDF</a></div>}</div>}
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
