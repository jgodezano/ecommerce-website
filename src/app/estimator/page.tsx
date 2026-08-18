"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, CircleHelp, Loader2, MapPin, PackageCheck, Ruler, Sparkles, Truck, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";
import dynamic from "next/dynamic";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  packageSize: string;
  coveragePerUnit: number;
  image?: string;
}

interface Recommendation extends Product {
  estimate: {
    recommendedQuantity: number;
    materialTotal: number;
    wastageAllowance: number;
  };
  wastagePercent: number;
  systemRole: string;
  purpose: string;
  matchScore: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
}

interface ProjectProfile {
  projectType: string;
  useCase: string;
  constructionStage: string;
  constructionMethod: string;
  loadRequirement: string;
  surfaceType: string;
  drainagePriority: string;
  style: string;
  colorPreference: string;
  maintenance: string;
  indoorOutdoor: string;
  budget: string;
  budgetTarget?: number;
  customProject?: string;
}

const INITIAL_PROFILE: ProjectProfile = {
  projectType: "",
  useCase: "",
  constructionStage: "",
  constructionMethod: "",
  loadRequirement: "",
  surfaceType: "",
  drainagePriority: "",
  style: "",
  colorPreference: "",
  maintenance: "",
  indoorOutdoor: "outdoor",
  budget: "standard",
};

type QuestionKey = keyof ProjectProfile;
interface Question {
  key: QuestionKey;
  label: string;
  description?: string;
  options: { value: string; label: string; description?: string }[];
  when?: (profile: ProjectProfile) => boolean;
}

const QUESTIONS: Question[] = [
  {
    key: "projectType",
    label: "What are you building?",
    options: [
      { value: "driveway", label: "Driveway or Parking", description: "Heavy load-bearing surface for vehicles" },
      { value: "pathway", label: "Walkway or Path", description: "Pedestrian traffic, garden paths" },
      { value: "terrace", label: "Terrace or Patio", description: "Outdoor living space, seating area" },
      { value: "landscape", label: "Landscape feature", description: "Decorative rocks, garden accents" },
      { value: "wall", label: "Retaining Wall", description: "Structural wall for soil or decoration" },
      { value: "other", label: "Other / Custom build", description: "Tell us about your specific project" },
    ],
  },
  {
    key: "useCase",
    label: "What is the main need?",
    options: [
      { value: "build-new", label: "Build something new", description: "Starting from scratch" },
      { value: "repair", label: "Repair or fix existing", description: "Maintenance or partial replacement" },
      { value: "decoration", label: "Additional decoration", description: "Enhancing the look of a project" },
    ],
  },
  {
    key: "constructionStage",
    label: "What is the current stage?",
    options: [
      { value: "planning", label: "Planning & Design", description: "Budgeting and choosing materials" },
      { value: "new", label: "New construction", description: "Foundation is ready or starting soon" },
      { value: "renovation", label: "Renovation", description: "Replacing old materials" },
    ],
  },
  {
    key: "constructionMethod",
    label: "Construction method preference?",
    when: (p) => ["driveway", "terrace", "wall"].includes(p.projectType),
    options: [
      { value: "mortar", label: "Mortar / Wet set", description: "Materials set in cement for stability" },
      { value: "surface", label: "Loose / Dry set", description: "Compacted base with aggregate finish" },
      { value: "structure", label: "Full structural", description: "Deep foundation and masonry" },
    ],
  },
  {
    key: "loadRequirement",
    label: "Expected traffic load?",
    options: [
      { value: "heavy", label: "Heavy (Vehicles)", description: "Cars, trucks, heavy equipment" },
      { value: "medium", label: "Medium (Pedestrian)", description: "High-traffic walkways, public spaces" },
      { value: "light", label: "Light (Decorative)", description: "Private gardens, low-traffic areas" },
    ],
  },
  {
    key: "surfaceType",
    label: "Existing surface condition?",
    options: [
      { value: "soil", label: "Raw soil / Earth", description: "Requires full excavation and base" },
      { value: "concrete", label: "Existing concrete", description: "Can lay materials on top" },
      { value: "gravel", label: "Old gravel / Base", description: "Requires leveling and topping" },
    ],
  },
  {
    key: "drainagePriority",
    label: "Drainage priority?",
    options: [
      { value: "high", label: "High priority", description: "Area prone to water pooling" },
      { value: "low", label: "Standard / Low", description: "Good natural drainage" },
    ],
  },
  {
    key: "style",
    label: "Desired style?",
    options: [
      { value: "modern", label: "Modern & Clean", description: "Uniform colors, sharp edges" },
      { value: "rustic", label: "Rustic & Natural", description: "Irregular shapes, earth tones" },
      { value: "elegant", label: "Elegant / Luxury", description: "Premium finish, polished look" },
    ],
  },
  {
    key: "colorPreference",
    label: "Color preference?",
    options: [
      { value: "neutral", label: "Neutral (Grey/White)", description: "Versatile and timeless" },
      { value: "warm", label: "Warm (Beige/Tan/Red)", description: "Inviting and natural" },
      { value: "dark", label: "Dark (Charcoal/Black)", description: "Bold and contemporary" },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance preference?",
    options: [
      { value: "low", label: "Low maintenance", description: "Easy to clean, durable" },
      { value: "standard", label: "Standard", description: "Occasional cleaning/weeding" },
    ],
  },
  {
    key: "indoorOutdoor",
    label: "Project location?",
    options: [
      { value: "outdoor", label: "Outdoor", description: "Exposed to weather" },
      { value: "indoor", label: "Indoor / Covered", description: "Interior floors or features" },
    ],
  },
  {
    key: "budget",
    label: "Project budget tier?",
    options: [
      { value: "economy", label: "Economy", description: "Practical and cost-effective" },
      { value: "standard", label: "Standard", description: "Quality materials, fair price" },
      { value: "premium", label: "Premium", description: "Best-in-class materials" },
    ],
  },
];

const DISCLAIMER = "This quotation is an estimate based on the information provided. Final quantity, delivery charges, material requirements, and pricing may be confirmed by our team after reviewing your project.";

type FollowUpAction = "official_review" | "site_visit" | "quote_list";

function EstimatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCustomerAuth();
  
  const [length, setLength] = useState(""); 
  const [width, setWidth] = useState(""); 
  const [area, setArea] = useState("");
  const [depthCm, setDepthCm] = useState("5");
  const [targetBudget, setTargetBudget] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState(""); 
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]); 
  const [profile, setProfile] = useState<ProjectProfile>(INITIAL_PROFILE);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<FollowUpAction | null>(null);
  const [error, setError] = useState("");
  const [handoffPending, setHandoffPending] = useState(false);

  useEffect(() => {
    fetch("/api/delivery").then((res) => res.json()).then((data) => setDeliveryZones(data.zones || [])).catch(() => {});
    
    const urlArea = searchParams.get("area");
    const urlDepth = searchParams.get("depth");
    const urlBudget = searchParams.get("targetBudget");
    const urlMaterial = searchParams.get("material");
    const urlZone = searchParams.get("zone");
    const urlServices = searchParams.get("services");
    const profileParam = searchParams.get("profile");
    const pendingParam = !profileParam ? sessionStorage.getItem("pendingEstimate") : null;

    if (urlArea) setArea(urlArea);
    if (urlDepth) setDepthCm(urlDepth);
    if (urlBudget) setTargetBudget(urlBudget);
    if (urlMaterial) setSelectedProductId(urlMaterial);
    if (urlZone) setDeliveryZoneId(urlZone);
    if (urlServices) setSelectedServiceIds(urlServices.split(",").filter(Boolean));

    if (profileParam || pendingParam) {
      try {
        const transferred = profileParam ? JSON.parse(profileParam) : (JSON.parse(pendingParam || "{}")?.projectProfile);
        if (transferred) {
          setProfile({ ...INITIAL_PROFILE, ...transferred });
          setHandoffPending(true);
        }
      } catch (err) {}
    }
  }, [searchParams]);

  const computedArea = useMemo(() => {
    const direct = Number(area);
    const base = direct > 0 ? direct : (Number(length) > 0 && Number(width) > 0 ? Number(length) * Number(width) : 0);
    const depthFactor = (Number(depthCm) || 5) / 5;
    return base > 0 ? base * depthFactor : 0;
  }, [area, length, width, depthCm]);

  const calculate = async (nextProductId = selectedProductId, nextServiceIds = selectedServiceIds, nextProfile = profile) => {
    setError("");
    if (!computedArea || computedArea <= 0) {
      setError("Enter a valid area.");
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
          targetBudget: Number(targetBudget || 0),
          projectProfile: { ...nextProfile, customProject }
        }),
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setServices(data.services || []);
      setEstimate(data);
      if (data.recommendations?.length > 0 && !nextProductId) {
        setSelectedProductId(data.recommendations[0].id);
      }
      return data;
    } catch (err: any) {
      setError("Calculation failed");
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
    if (!computedArea || computedArea <= 0) return;
    setQuestionnaireOpen(true);
    setQuestionIndex(0);
  };

  const visibleQuestions = QUESTIONS.filter(q => !q.when || q.when(profile));

  const chooseAnswer = async (value: string) => {
    const question = visibleQuestions[questionIndex];
    const newProfile = { ...profile, [question.key]: value };
    setProfile(newProfile);

    if (questionIndex < visibleQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setQuestionnaireOpen(false);
      await calculate(selectedProductId, selectedServiceIds, newProfile);
    }
  };

  const handleFollowUp = async (action: FollowUpAction) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingEstimate", JSON.stringify({
        areaSqm: computedArea,
        depthCm,
        selectedProductId,
        selectedServiceIds,
        deliveryZoneId,
        targetBudget,
        projectProfile: { ...profile, customProject }
      }));
      router.push("/login?redirect=/estimator");
      return;
    }

    setSubmittingAction(action);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          areaSqm: computedArea,
          depthCm,
          selectedProductId,
          selectedServiceIds,
          deliveryZoneId,
          projectProfile: { ...profile, customProject }
        }),
      });
      if (!response.ok) throw new Error();
      router.push("/account/quotes");
    } catch (err) {
      setError("Submission failed");
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-accent-600 font-semibold mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="uppercase tracking-wider text-sm">Guided project estimator</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Answer a few project questions. Get a smarter material shortlist.
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            We use your area, depth, intended use, traffic, drainage, style, maintenance, and budget to rank materials that are active and available in your inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className={`flex items-center p-4 rounded-xl border-2 transition-all ${!questionnaireOpen && !recommendations.length ? 'border-accent-500 bg-white shadow-md' : 'border-slate-200 bg-slate-100 opacity-60'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${!questionnaireOpen && !recommendations.length ? 'bg-accent-500 text-white' : 'bg-slate-300 text-slate-600'}`}>1</div>
            <div className="font-bold text-slate-900">Project area & depth</div>
          </div>
          <div className={`flex items-center p-4 rounded-xl border-2 transition-all ${questionnaireOpen ? 'border-accent-500 bg-white shadow-md' : 'border-slate-200 bg-slate-100 opacity-60'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${questionnaireOpen ? 'bg-accent-500 text-white' : 'bg-slate-300 text-slate-600'}`}>2</div>
            <div className="font-bold text-slate-900">Project questions</div>
          </div>
          <div className={`flex items-center p-4 rounded-xl border-2 transition-all ${recommendations.length > 0 && !questionnaireOpen ? 'border-accent-500 bg-white shadow-md' : 'border-slate-200 bg-slate-100 opacity-60'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${recommendations.length > 0 && !questionnaireOpen ? 'bg-accent-500 text-white' : 'bg-slate-300 text-slate-600'}`}>3</div>
            <div className="font-bold text-slate-900">Material shortlist</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${!questionnaireOpen && !recommendations.length ? 'ring-2 ring-accent-500' : ''}`}>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-accent-500">01.</span> Enter area and application depth
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Length (m)</label>
                    <input type="number" value={length} onChange={(e) => { setLength(e.target.value); setArea(""); }} placeholder="e.g. 10" className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-accent-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Width (m)</label>
                    <input type="number" value={width} onChange={(e) => { setWidth(e.target.value); setArea(""); }} placeholder="e.g. 5" className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-accent-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Depth (cm)</label>
                  <input type="number" value={depthCm} onChange={(e) => setDepthCm(e.target.value)} placeholder="e.g. 5" className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-accent-500 outline-none" />
                </div>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Or</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Or enter total area (m²)</label>
                  <input type="number" value={area} onChange={(e) => { setArea(e.target.value); setLength(""); setWidth(""); }} placeholder="Direct area input" className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-accent-500 outline-none" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-accent-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Effective area:</div>
                      <div className="text-lg font-bold text-slate-900">{computedArea > 0 ? `${computedArea.toFixed(2)} m²` : "—"}</div>
                    </div>
                  </div>
                </div>
                <Button onClick={startQuestionnaire} disabled={!computedArea || computedArea <= 0} className="w-full py-4 text-lg font-bold">Start project questionnaire</Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[400px] flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Material Shortlist & Quotation</h2>
              {!recommendations.length && !loading && (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-12">
                  <CircleHelp className="w-10 h-10 text-slate-300 mb-6" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Complete dimensions & questions on the left</h3>
                </div>
              )}
              {loading && (
                <div className="flex-grow flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-accent-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Analyzing inventory and calculating requirements...</p>
                </div>
              )}
              {recommendations.length > 0 && !loading && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-accent-50 rounded-xl border border-accent-100">
                      <div className="text-xs font-bold text-accent-600 uppercase mb-1">Material Total</div>
                      <div className="text-2xl font-black text-slate-900">{formatPrice(estimate.totals.materialTotal)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-1">Service & Labor</div>
                      <div className="text-2xl font-black text-slate-900">{formatPrice(estimate.totals.serviceTotal)}</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl text-white">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Estimate</div>
                      <div className="text-2xl font-black text-white">{formatPrice(estimate.totals.total)}</div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recommendations.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-bold text-slate-900">{rec.name}</div>
                              <div className="text-[10px] font-bold text-accent-600 uppercase tracking-tighter mt-0.5">{rec.systemRole}</div>
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-slate-700">{rec.estimate.recommendedQuantity} {rec.unit}s</td>
                            <td className="px-4 py-4 text-right font-bold text-slate-900">{formatPrice(rec.estimate.materialTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                    <Button onClick={() => handleFollowUp("official_review")} loading={submittingAction === "official_review"} className="flex-1 min-w-[200px] py-4 bg-slate-900 text-white hover:bg-slate-800">Request Official Review</Button>
                    <Button onClick={() => handleFollowUp("site_visit")} loading={submittingAction === "site_visit"} variant="outline" className="flex-1 min-w-[200px] py-4 border-2 border-slate-200 hover:bg-slate-50">Book Site Visit</Button>
                    <Button onClick={() => handleFollowUp("quote_list")} loading={submittingAction === "quote_list"} variant="outline" title="Add to Quote List" className="px-6 py-4 border-2 border-slate-200 hover:bg-slate-50 flex items-center justify-center">
                      <Check className="w-6 h-6 text-accent-600" />
                    </Button>
                  </div>
                  <p className="mt-4 text-[10px] text-slate-400 italic text-center">{DISCLAIMER}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {questionnaireOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-accent-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <Sparkles className="w-4 h-4" />
                  Project Profiling
                </div>
                <h3 className="text-3xl font-black mb-2">Step {questionIndex + 1} of {visibleQuestions.length}</h3>
                <p className="text-slate-400 text-sm max-w-md">We&apos;re matching your project needs with our active inventory roles.</p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <h4 className="text-xl font-bold text-slate-900 mb-2">{visibleQuestions[questionIndex].label}</h4>
                {visibleQuestions[questionIndex].description && <p className="text-slate-500 text-sm">{visibleQuestions[questionIndex].description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleQuestions[questionIndex].options.map((option) => (
                  <button key={option.value} onClick={() => chooseAnswer(option.value)} className="group text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-accent-500 hover:bg-accent-50/50 transition-all duration-200">
                    <div className="font-bold text-slate-900 group-hover:text-accent-700 transition-colors">{option.label}</div>
                    {option.description && <div className="text-xs text-slate-400 mt-1 leading-relaxed">{option.description}</div>}
                  </button>
                ))}
              </div>

              {visibleQuestions[questionIndex].key === "projectType" && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Something else?</label>
                  <div className="flex gap-2">
                    <input type="text" value={customProject} onChange={(e) => setCustomProject(e.target.value)} placeholder="e.g. Fixing a backyard wall" className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-accent-500 outline-none" />
                    <Button onClick={() => chooseAnswer("other")} className="px-6">Next</Button>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setQuestionnaireOpen(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancel & Exit</button>
                <div className="flex gap-1">
                  {visibleQuestions.map((_, i) => (
                    <div key={i} className={`w-8 h-1.5 rounded-full transition-all ${i === questionIndex ? 'bg-accent-500 w-12' : i < questionIndex ? 'bg-slate-900' : 'bg-slate-100'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const EstimatorPage = dynamic(() => Promise.resolve(EstimatorContent), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 text-accent-500 animate-spin" /></div>
});

export default EstimatorPage;
