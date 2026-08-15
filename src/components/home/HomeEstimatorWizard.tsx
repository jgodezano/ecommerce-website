import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleHelp, Layers3, Loader2, Ruler, Truck, Wrench } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";

type ProjectProfile = {
  projectType: string;
  useCase: string;
  loadRequirement: string;
  surfaceType: string;
  drainagePriority: string;
  style: string;
  colorPreference: string;
  maintenance: string;
  indoorOutdoor: string;
  budget: string;
  constructionStage: string;
  constructionMethod: string;
  customProject?: string;
};

type Recommendation = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  unit: string;
  price: number;
  coveragePerUnit: number;
  wastagePercent: number;
  matchReasons?: string[];
  estimate: { recommendedQuantity: number; materialTotal: number; baseQuantity: number };
};

type Service = { id: string; name: string; description?: string; pricingModel: "flat" | "per_sqm"; price: number; unit?: string; total?: number; recommended?: boolean; recommendationReason?: string; selected?: boolean };
type DeliveryZone = { id: string; name: string; fee: number; min_order_for_free?: number; estimated_days?: string };
type Question = { key: keyof ProjectProfile; title: string; help: string; options: { value: string; label: string; description: string }[]; when?: (profile: ProjectProfile) => boolean };

const EMPTY_PROFILE: ProjectProfile = { projectType: "", useCase: "", loadRequirement: "", surfaceType: "", drainagePriority: "", style: "", colorPreference: "", maintenance: "", indoorOutdoor: "", budget: "", constructionStage: "", constructionMethod: "", customProject: "" };
const STYLE_GUIDANCE: Record<string, string> = {
  natural: "Natural direction: combine earthy tones, irregular textures, and planting-friendly materials. Use this as a starting style, then confirm the final finish on site.",
  modern: "Modern direction: prioritize clean edges, consistent sizing, and neutral or contrasting finishes for a structured look.",
  rustic: "Rustic direction: prioritize warm earth tones, textured surfaces, and materials with natural variation.",
  tropical: "Tropical direction: prioritize durable outdoor finishes, warm accents, and planting-friendly surfaces.",
  clean: "Clean and simple direction: prioritize consistent sizing, restrained colors, and low-maintenance finishes.",
};

const QUESTIONS: Question[] = [
  { key: "projectType", title: "What are you building?", help: "This helps distinguish decorative, access, drainage, walls, and structural needs.", options: [{ value: "landscaping", label: "Landscape feature", description: "Garden beds, borders, accents" }, { value: "garden", label: "Garden area", description: "Planting beds and outdoor spaces" }, { value: "pathway", label: "Walkway or patio", description: "Pedestrian paths and sitting areas" }, { value: "driveway", label: "Driveway or parking", description: "Vehicle access and parking" }, { value: "drainage", label: "Drainage or erosion", description: "Runoff, slopes, and water control" }, { value: "construction", label: "Construction base", description: "A stable base or fill application" }, { value: "other", label: "Other / Custom project", description: "Fixing walls, retaining structures, or custom builds" }] },
  { key: "useCase", title: "What will the material do?", help: "Choose the main job so we can prioritize the right performance characteristics.", options: [{ value: "repair-fix", label: "Repair or fix existing", description: "Fixing walls, filling cracks, or refreshing an area" }, { value: "build-new", label: "Build something new", description: "Create a new feature, wall, or structure from scratch" }, { value: "decorative", label: "Add decoration / finish", description: "Improve visual appeal, color, and texture" }, { value: "structural", label: "Provide structural support", description: "Base layers, retaining weight, or load-bearing" }, { value: "drainage", label: "Manage drainage or erosion", description: "Water control, runoff, and soil protection" }, { value: "maintenance", label: "Reduce maintenance", description: "Covering soil, suppressing weeds, or easy-care surfaces" }] },
  { key: "loadRequirement", title: "How much traffic or load will it receive?", help: "A driveway needs a different material profile than a decorative garden border.", options: [{ value: "light", label: "Light use", description: "Decorative areas or occasional walking" }, { value: "medium", label: "Regular foot traffic", description: "Paths, patios, and everyday use" }, { value: "heavy", label: "Vehicles or heavy loads", description: "Driveways, parking, or equipment" }] },
  { key: "surfaceType", title: "What surface are you starting from?", help: "The existing base affects preparation and the material system we recommend.", options: [{ value: "soil", label: "Soil or garden bed", description: "Natural ground or planting soil" }, { value: "concrete", label: "Concrete or slab", description: "An existing hard surface" }, { value: "existing-gravel", label: "Existing gravel", description: "A previous aggregate base" }, { value: "mixed", label: "Mixed or unsure", description: "Different surfaces across the project" }] },
  { key: "drainagePriority", title: "How important is drainage?", help: "Tell us whether managing rainwater is a key part of the project.", options: [{ value: "low", label: "Not a major concern", description: "The area already drains well" }, { value: "medium", label: "Some attention needed", description: "We want a practical solution" }, { value: "high", label: "High priority", description: "Water pooling or runoff is a concern" }] },
  { key: "style", title: "Which look are you aiming for?", help: "Style helps rank materials with a finish and texture that fit the space.", options: [{ value: "natural", label: "Natural", description: "Organic, earthy, and relaxed" }, { value: "modern", label: "Modern", description: "Clean lines and contemporary contrast" }, { value: "rustic", label: "Rustic", description: "Warm, textured, and traditional" }, { value: "tropical", label: "Tropical", description: "Lush, bright, and garden-focused" }, { value: "clean", label: "Clean and simple", description: "Neat, minimal, and easy to maintain" }] },
  { key: "colorPreference", title: "Do you have a color preference?", help: "Choose any if you would rather let available inventory guide you.", options: [{ value: "any", label: "Open to options", description: "Show the best available matches" }, { value: "neutral", label: "Neutral", description: "Soft gray, beige, or balanced tones" }, { value: "white", label: "Light or white", description: "Bright, clean, and reflective" }, { value: "dark", label: "Dark or charcoal", description: "Strong contrast and modern depth" }, { value: "warm", label: "Warm earth tones", description: "Tan, brown, terracotta, or golden" }, { value: "mixed", label: "Mixed colors", description: "Natural variation and visual texture" }] },
  { key: "maintenance", title: "How much maintenance do you prefer?", help: "This balances appearance with long-term upkeep.", options: [{ value: "low", label: "Keep it low", description: "Minimal refreshing and maintenance" }, { value: "medium", label: "Some upkeep is fine", description: "A balance of appearance and effort" }, { value: "high", label: "I enjoy maintaining it", description: "Prioritize detail and visual control" }] },
  { key: "indoorOutdoor", title: "Where will the material be used?", help: "Some materials are better suited to weather exposure or indoor display.", options: [{ value: "outdoor", label: "Outdoor", description: "Garden, yard, path, or driveway" }, { value: "indoor", label: "Indoor", description: "Interior feature or display" }, { value: "both", label: "Indoor and outdoor", description: "I want a flexible material" }] },
  { key: "budget", title: "What is your starting budget?", help: "This filters the ranking without hiding other available options.", options: [{ value: "economy", label: "Economy", description: "Prioritize practical value" }, { value: "standard", label: "Standard", description: "Balance cost and finish" }, { value: "premium", label: "Premium", description: "Prioritize finish and presentation" }] },
  { key: "constructionStage", title: "What stage is the project at?", help: "This helps us separate a new build from a repair or improvement.", when: (profile) => ["terrace", "wall", "construction", "other"].includes(profile.projectType) || ["repair-fix", "build-new", "structural"].includes(profile.useCase), options: [{ value: "new", label: "New construction", description: "Starting the structure or feature from scratch" }, { value: "repair", label: "Repair existing", description: "Fixing damage, cracks, or a failed section" }, { value: "improvement", label: "Improve or extend", description: "Upgrading or adding to something already there" }] },
  { key: "constructionMethod", title: "What kind of construction or finish do you need?", help: "If you are unsure, choose the option closest to your idea and we will suggest a practical starting system.", when: (profile) => ["terrace", "wall", "construction"].includes(profile.projectType) || ["build-new", "structural"].includes(profile.useCase), options: [{ value: "foundation", label: "Foundation or concrete base", description: "Footings, slabs, or a stable supporting base" }, { value: "masonry", label: "Wall, block, or retaining work", description: "Masonry, partitions, retaining walls, or repairs" }, { value: "surface", label: "Finished surface or paving", description: "The visible floor, patio, terrace, or walkway finish" }, { value: "unsure", label: "I am not sure", description: "Let the recommendation guide my starting point" }] },
];

const QUESTION_FLOW_KEYS: (keyof ProjectProfile)[] = ["projectType", "useCase", "constructionStage", "constructionMethod", "loadRequirement", "surfaceType", "drainagePriority", "style", "colorPreference", "maintenance", "indoorOutdoor", "budget"];

export default function HomeEstimatorWizard() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [area, setArea] = useState("");
  const [depthCm, setDepthCm] = useState("5"); // Height/depth thickness in cm (default 5cm)
  const [customProject, setCustomProject] = useState("");
  const [profile, setProfile] = useState<ProjectProfile>(EMPTY_PROFILE);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [editingInputs, setEditingInputs] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((response) => response.json()),
      fetch("/api/delivery").then((response) => response.json()),
    ]).then(([serviceData, deliveryData]) => {
      setServices(serviceData.services || []);
      setDeliveryZones(deliveryData.zones || []);
    }).catch(() => {});
  }, []);

  const computedArea = useMemo(() => {
    const direct = Number(area);
    const base = direct > 0 ? direct : (Number(length) > 0 && Number(width) > 0 ? Number(length) * Number(width) : 0);
    const depthFactor = (Number(depthCm) || 5) / 5; // 5cm is standard baseline depth
    return base > 0 ? base * depthFactor : 0;
  }, [area, length, width, depthCm]);

  const selectedRecommendation = recommendations.find((item) => item.id === selectedProductId) || recommendations[0];
  const currentTotals = estimate?.totals || { materialTotal: selectedRecommendation?.estimate.materialTotal || 0, deliveryFee: 0, serviceTotal: 0, total: selectedRecommendation?.estimate.materialTotal || 0 };
  const orderedQuestions = QUESTION_FLOW_KEYS.map((key) => QUESTIONS.find((item) => item.key === key)).filter((item): item is Question => Boolean(item));
  const visibleQuestions = orderedQuestions.filter((item) => !item.when || item.when(profile));
  const question = visibleQuestions[questionIndex] || visibleQuestions[0];
  const profileComplete = visibleQuestions.every((item) => Boolean(profile[item.key]));
  const projectTypeLabel = QUESTIONS[0].options.find((option) => option.value === profile.projectType)?.label || profile.projectType;
  const useCaseLabel = QUESTIONS[1].options.find((option) => option.value === profile.useCase)?.label || profile.useCase;
  const constructionStageLabel = QUESTIONS.find((item) => item.key === "constructionStage")?.options.find((option) => option.value === profile.constructionStage)?.label || profile.constructionStage;
  const constructionMethodLabel = QUESTIONS.find((item) => item.key === "constructionMethod")?.options.find((option) => option.value === profile.constructionMethod)?.label || profile.constructionMethod;
  const styleGuidance = STYLE_GUIDANCE[profile.style] || "Style direction: we will use your answers and available inventory as a practical starting point. Final appearance should be confirmed with a sample or site review.";

  const calculate = async (nextProductId = selectedProductId, nextServiceIds = selectedServiceIds, nextDeliveryZoneId = deliveryZoneId, nextProfile = profile) => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter a valid length and width, or enter your total area first.");
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
          deliveryZoneId: nextDeliveryZoneId,
          projectProfile: { ...nextProfile, projectType: nextProfile.projectType === "other" && customProject ? `other: ${customProject}` : nextProfile.projectType },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to calculate your quotation.");
      setRecommendations(data.recommendations || []);
      setServices(data.services || []);
      setSelectedServiceIds(data.selectedServiceIds || nextServiceIds);
      setEstimate(data);
      if (data.selectedProductId && !nextProductId) setSelectedProductId(data.selectedProductId);
      return data;
    } catch (err: any) {
      setError(err.message || "Unable to calculate your quotation.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startQuestionnaire = () => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter your length and width (and optional depth), or total area, before starting the questions.");
      return;
    }
    setEditingInputs(false);
    setQuestionnaireOpen(true);
    setQuestionIndex(0);
  };

  const chooseAnswer = async (value: string) => {
    const updatedProfile = { ...profile, [question.key]: value };
    setProfile(updatedProfile);
    setError("");

    if (value === "other" && question.key === "projectType") {
      // Stay on question to let them type custom text
      return;
    }

    if (questionIndex < visibleQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
    } else {
      setQuestionnaireOpen(false);
      setEditingInputs(false);
      await calculate(selectedProductId, selectedServiceIds, deliveryZoneId, updatedProfile);
    }
  };

  const nextQuestion = async () => {
    if (!profile[question.key]) {
      setError("Choose an answer so we can make a useful recommendation.");
      return;
    }
    setError("");
    if (question.key === "projectType" && profile.projectType === "other" && !customProject) {
      setError("Please specify what you are building.");
      return;
    }
    if (questionIndex < visibleQuestions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    setQuestionnaireOpen(false);
    setEditingInputs(false);
    await calculate(selectedProductId, selectedServiceIds, deliveryZoneId, profile);
  };

  const previousQuestion = () => {
    setError("");
    if (questionIndex === 0) {
      setQuestionnaireOpen(false);
      setEditingInputs(true);
    } else setQuestionIndex((current) => current - 1);
  };

  const chooseMaterial = async (id: string) => {
    setSelectedProductId(id);
    await calculate(id, selectedServiceIds, deliveryZoneId, profile);
  };

  const toggleService = async (id: string) => {
    const next = selectedServiceIds.includes(id) ? selectedServiceIds.filter((item) => item !== id) : [...selectedServiceIds, id];
    setSelectedServiceIds(next);
    await calculate(selectedProductId, next, deliveryZoneId, profile);
  };

  const changeDeliveryZone = async (id: string) => {
    setDeliveryZoneId(id);
    if (estimate) await calculate(selectedProductId, selectedServiceIds, id, profile);
  };

  return (
    <section id="estimate" className="relative -mt-10 scroll-mt-8 pb-20">
      <div className="container-custom">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="grid gap-0 lg:grid-cols-[.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-7 text-white sm:p-10">
              <div className="flex items-center gap-3 text-emerald-300"><Ruler className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-[.16em]">Instant project quotation</span></div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{estimate && !questionnaireOpen && !editingInputs ? "Here is the project plan we built with you." : "Tell us about your space. We&apos;ll calculate the materials."}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">{estimate && !questionnaireOpen && !editingInputs ? "We used your answers to prepare a practical starting recommendation. Review the assumptions, materials, delivery, and estimated cost on the right." : "Enter your project dimensions and depth (height), answer a few guided questions, and get instant material quantities and pricing."}</p>

              {estimate && !questionnaireOpen && !editingInputs && (
                <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-white/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-200">Project summary</p>
                    <button type="button" onClick={() => { setEstimate(null); setRecommendations([]); setEditingInputs(true); }} className="text-xs font-semibold text-emerald-200 hover:text-white">Edit details</button>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Project</dt><dd className="text-right font-semibold text-white">{profile.projectType === "other" && customProject ? customProject : projectTypeLabel}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Main need</dt><dd className="text-right font-semibold text-white">{useCaseLabel || "Not specified"}</dd></div>
                    {constructionStageLabel && <div className="flex justify-between gap-4"><dt className="text-slate-400">Stage</dt><dd className="text-right font-semibold text-white">{constructionStageLabel}</dd></div>}
                    {constructionMethodLabel && <div className="flex justify-between gap-4"><dt className="text-slate-400">Construction focus</dt><dd className="text-right font-semibold text-white">{constructionMethodLabel}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Dimensions</dt><dd className="text-right font-semibold text-white">{computedArea.toFixed(2)} m² · {depthCm || 5} cm depth</dd></div>
                  </dl>
                </div>
              )}

              {editingInputs && !questionnaireOpen && (
                <>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <label className="text-sm font-medium text-slate-200">Length (m)<input type="number" min="0" step="0.1" value={length} onChange={(event) => setLength(event.target.value)} placeholder="e.g. 10" className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-300" /></label>
                    <label className="text-sm font-medium text-slate-200">Width (m)<input type="number" min="0" step="0.1" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-300" /></label>
                    <label className="text-sm font-medium text-slate-200" title="Application depth or thickness (height)">Depth / Height (cm)<input type="number" min="1" max="100" value={depthCm} onChange={(event) => setDepthCm(event.target.value)} placeholder="e.g. 5" className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-300" /></label>
                  </div>
                  <div className="mt-4"><label className="text-sm font-medium text-slate-200">Or enter total area (m²)<input type="number" min="0" step="0.1" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Direct area input" className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-300" /></label><p className="mt-2 text-xs text-slate-400">Effective calculation area (factoring depth): <strong className="text-emerald-300">{computedArea ? `${computedArea.toFixed(2)} m²` : "—"}</strong></p></div>
                  <Button onClick={startQuestionnaire} disabled={loading} size="lg" className="mt-7 w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300">Calculate requirements <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </>
              )}
              {error && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
              
              {questionnaireOpen && (
                <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[.15em] text-emerald-200">
                    <span>Question {questionIndex + 1} of {visibleQuestions.length}</span>
                    <span>{Math.round(((questionIndex + 1) / visibleQuestions.length) * 100)}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${((questionIndex + 1) / visibleQuestions.length) * 100}%` }} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{question.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{question.help}</p>
                  
                  <div className="mt-5 grid gap-2">
                    {question.options.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => void chooseAnswer(option.value)}
                        className={`rounded-xl border p-3 text-left transition ${profile[question.key] === option.value ? "border-emerald-300 bg-emerald-300/15" : "border-white/10 bg-white/5 hover:border-emerald-300/50"}`}
                      >
                        <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                          <span>{option.label}</span>
                          {profile[question.key] === option.value && <Check className="h-4 w-4 text-emerald-300" />}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                      </button>
                    ))}
                  </div>

                  {question.key === "projectType" && profile.projectType === "other" && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-emerald-200">Please specify what you are building (e.g. wall repair, retaining wall):</label>
                      <input
                        type="text"
                        value={customProject}
                        onChange={(e) => setCustomProject(e.target.value)}
                        placeholder="e.g. Fixing garden wall"
                        className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
                      />
                    </div>
                  )}

                  <div className="mt-5 flex justify-between gap-3">
                    <button type="button" onClick={previousQuestion} className="inline-flex items-center text-sm font-semibold text-slate-300 hover:text-white"><ChevronLeft className="mr-1 h-4 w-4" /> Back</button>
                    <button type="button" onClick={() => void nextQuestion()} className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                      {questionIndex === visibleQuestions.length - 1 ? "Show my quotation" : "Continue"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-7 sm:p-10">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-emerald-700">Your instant quotation</p><h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Materials matched to your answers</h3></div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:flex"><Layers3 className="h-6 w-6" /></div>
              </div>
              {!estimate ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-stone-50 p-8 text-center">
                  <CircleHelp className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-medium text-slate-700">Your recommendations will appear here</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Enter your dimensions and depth, answer the quick questions, and we&apos;ll calculate the required quantity and cost instantly.</p>
                </div>
              ) : loading ? (
                <div className="mt-8 flex items-center justify-center rounded-2xl border border-slate-200 bg-stone-50 p-10 text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating your quotation…</div>
              ) : (
                <div className="mt-7 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[.15em] text-emerald-700">Recommended materials from inventory</p>
                    <div className="mt-4 grid gap-3">
                      {recommendations.length ? recommendations.map((item) => (
                        <button type="button" key={item.id} onClick={() => void chooseMaterial(item.id)} className={`rounded-xl border p-4 text-left transition ${selectedRecommendation?.id === item.id ? "border-emerald-500 bg-white shadow-sm" : "border-emerald-100 bg-white/60 hover:border-emerald-300"}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-950">{item.name}</p>
                              <div className="mt-2 flex items-baseline gap-2"><span className="text-2xl font-bold text-emerald-800">{item.estimate.recommendedQuantity}</span><span className="text-sm font-semibold text-emerald-800">{item.unit} estimated</span></div>
                              <p className="mt-1 text-xs text-slate-600">Based on {item.coveragePerUnit} m²/{item.unit} coverage and {item.wastagePercent}% allowance</p>
                              {item.matchReasons?.length ? <p className="mt-2 text-xs leading-5 text-emerald-800">{item.matchReasons.join(" · ")}</p> : null}
                            </div>
                            <p className="whitespace-nowrap text-sm font-bold text-emerald-800">{formatPrice(item.estimate.materialTotal)}</p>
                          </div>
                        </button>
                      )) : <p className="text-sm text-emerald-900">No configured inventory matched those answers yet. Try another project profile or configure more demo materials in Admin → Products.</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><p className="text-xs font-semibold uppercase tracking-[.15em] text-sky-700">Optional style direction</p><p className="mt-2 text-sm leading-6 text-sky-950">{styleGuidance}</p><p className="mt-2 text-xs leading-5 text-sky-800">For repairs and custom work, this is guidance only because the existing site condition and exact finish cannot be verified from the questionnaire.</p></div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">Delivery zone
                      <select value={deliveryZoneId} onChange={(event) => void changeDeliveryZone(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal">
                        <option value="">Select later</option>
                        {deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {formatPrice(zone.fee)}</option>)}
                      </select>
                    </label>
                    <div className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">Effective Area & Depth<p className="mt-1 text-base text-slate-950">{computedArea.toFixed(2)} m² <span className="text-xs font-normal text-slate-500">({depthCm || 5}cm depth)</span></p></div>
                  </div>

                  {services.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Merica services for this project</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">These services are matched to your answers. Select the ones you want included in the instant quotation.</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {services.filter((service) => service.recommended || selectedServiceIds.includes(service.id)).slice(0, 4).map((service) => (
                          <button type="button" key={service.id} onClick={() => void toggleService(service.id)} className={`rounded-xl border p-3 text-left ${selectedServiceIds.includes(service.id) ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">{service.name.toLowerCase().includes("install") || service.name.toLowerCase().includes("masonry") || service.name.toLowerCase().includes("terrace") ? <Wrench className="h-4 w-4" /> : <Truck className="h-4 w-4" />}</span>
                              {service.name}
                              <span className="ml-auto text-xs text-slate-500">{formatPrice(service.price)}{service.pricingModel === "per_sqm" ? "/m²" : ""}</span>
                            </span>
                            <span className="mt-1 block text-xs font-normal text-slate-500">{service.recommendationReason || service.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="flex items-center justify-between text-sm text-slate-300"><span>Materials</span><span>{formatPrice(currentTotals.materialTotal)}</span></div>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-300"><span>Delivery</span><span>{formatPrice(currentTotals.deliveryFee)}</span></div>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-300"><span>Services</span><span>{formatPrice(currentTotals.serviceTotal)}</span></div>
                    <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
                      <span className="font-semibold">Estimated total</span>
                      <span className="text-2xl font-bold text-emerald-300">{formatPrice(currentTotals.total)}</span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">Demo quotation based on configured SQLite inventory. Final pricing and availability can be confirmed when you connect the production database.</p>
                      <Link href={`/estimator?area=${encodeURIComponent(computedArea.toString())}&depth=${encodeURIComponent(depthCm || "5")}${selectedRecommendation ? `&material=${encodeURIComponent(selectedRecommendation.id)}` : ""}${deliveryZoneId ? `&zone=${encodeURIComponent(deliveryZoneId)}` : ""}${selectedServiceIds.length ? `&services=${encodeURIComponent(selectedServiceIds.join(","))}` : ""}&profile=${encodeURIComponent(JSON.stringify({ ...profile, customProject }))}`} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Open full quotation <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
