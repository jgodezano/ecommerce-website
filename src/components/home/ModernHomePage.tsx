"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, ChevronRight, Compass, HardHat, Layers3, MapPin, Ruler, ShieldCheck, Sparkles, Truck, Wrench } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import BuildProgressAnimation from "@/components/home/BuildProgressAnimation";
import HomeEstimatorWizard from "@/components/home/HomeEstimatorWizard";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  images?: string[];
  materialType?: string;
};

type Service = { id: string; name: string; description?: string; pricingModel: "flat" | "per_sqm"; price: number; unit?: string };

type Recommendation = Product & { coveragePerUnit: number; estimate: { recommendedQuantity: number; materialTotal: number }; wastagePercent: number };

const categoryShowcase = [
  { title: "Decorative stone", application: "Garden borders, courtyards, and feature beds", image: "/images/home/landscape-stone-garden.jpg", href: "/categories/tumbled-stones", tone: "from-emerald-950/80" },
  { title: "Landscape rock", application: "Low-maintenance outdoor spaces and pathways", image: "/images/home/landscape-rocks.webp", href: "/categories/raw-crystals", tone: "from-slate-950/80" },
  { title: "Garden features", application: "Rock gardens, accents, and natural focal points", image: "/images/home/rock-garden.jpg", href: "/categories/geodes-clusters", tone: "from-amber-950/80" },
];

const processSteps = [
  { number: "01", icon: Ruler, title: "Tell us your area", text: "Enter length and width or provide the total project area in square meters." },
  { number: "02", icon: Compass, title: "Choose a material", text: "Compare configured materials by coverage, wastage, unit, and estimated cost." },
  { number: "03", icon: Calculator, title: "See your estimate", text: "Get a clear quantity recommendation with service and delivery options." },
  { number: "04", icon: CheckCircle2, title: "Request a quotation", text: "Send the project details to our team for review and confirmation." },
];

export default function ModernHomePage() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [area, setArea] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?featured=true").then((response) => response.json()).then((data) => setProducts(data.products || [])).catch(() => {});
    fetch("/api/services").then((response) => response.json()).then((data) => setServices(data.services || [])).catch(() => {});
  }, []);

  const computedArea = useMemo(() => {
    const direct = Number(area);
    if (direct > 0) return direct;
    const parsedLength = Number(length);
    const parsedWidth = Number(width);
    return parsedLength > 0 && parsedWidth > 0 ? parsedLength * parsedWidth : 0;
  }, [area, length, width]);

  const selected = recommendations.find((item) => item.id === selectedId) || recommendations[0];
  const showcaseProducts = products.slice(0, 3);

  const calculate = () => {
    if (!computedArea || computedArea <= 0) {
      setError("Enter a valid length and width, or a total area in square meters.");
      return;
    }
    window.location.assign(`/estimator?area=${encodeURIComponent(computedArea)}`);
  };

  return (
    <main className="bg-stone-50 text-slate-900">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10"><img src="/images/home/landscape-stone-garden.jpg" alt="Landscaped garden with decorative rocks" className="h-full w-full object-cover opacity-35" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/25" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(16,185,129,.28),transparent_34%)]" /></div>
        <div className="container-custom relative grid min-h-[680px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
          <div className="max-w-2xl animate-[slideDown_.6s_ease-out]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-emerald-200 backdrop-blur"><Sparkles className="h-4 w-4" /> Materials, measured with confidence</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl lg:text-7xl">Build your project with <span className="text-emerald-300">confidence.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200 sm:text-xl">Tell us about your space and we&apos;ll help estimate the materials, quantity, delivery, and services you may need.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="#estimate"><Button size="lg" className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">Calculate my estimate <ArrowRight className="ml-2 h-5 w-5" /></Button></Link><Link href="#materials"><Button variant="outline" size="lg" className="border-white/30 text-white hover:border-white hover:bg-white hover:text-slate-950">Explore materials</Button></Link></div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Clear estimate breakdowns</span><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-300" /> Lipa City, Batangas</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -left-6 -top-8 h-24 w-24 rounded-full border border-emerald-300/30 bg-emerald-300/10 blur-sm" /><div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full border border-amber-200/20 bg-amber-200/10 blur-sm" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl shadow-black/40 backdrop-blur-md"><img src="/images/home/rock-garden.jpg" alt="Rock garden project inspiration" className="h-[420px] w-full rounded-[1.5rem] object-cover" /><div className="absolute bottom-7 left-7 right-7 flex items-center justify-between rounded-2xl border border-white/15 bg-slate-950/75 p-4 backdrop-blur"><div><p className="text-xs uppercase tracking-[.18em] text-emerald-200">Start with your space</p><p className="mt-1 text-sm font-medium text-white">Area → material → quotation</p></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-slate-950"><ArrowRight className="h-5 w-5" /></div></div></div>
            <div className="mt-4"><BuildProgressAnimation /></div>
          </div>
        </div>
      </section>

      <HomeEstimatorWizard />

      <section className="border-y border-slate-200 bg-white py-20"><div className="container-custom"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-700">A simpler way to plan</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.03em] text-slate-950 sm:text-5xl">From blank space to a confident next step.</h2></div><div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">{processSteps.map((step) => { const Icon = step.icon; return <div key={step.number} className="group bg-white p-7 transition hover:bg-emerald-50"><div className="flex items-center justify-between"><span className="text-sm font-bold tracking-[.18em] text-emerald-700">{step.number}</span><Icon className="h-6 w-6 text-slate-400 transition group-hover:text-emerald-700" /></div><h3 className="mt-12 text-xl font-semibold text-slate-950">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p></div>; })}</div></div></section>

      <section id="materials" className="scroll-mt-8 bg-stone-50 py-20"><div className="container-custom"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-700">Explore our materials</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.03em] text-slate-950 sm:text-5xl">Materials with a purpose.</h2><p className="mt-4 text-base leading-7 text-slate-600">Browse materials for decorative spaces, pathways, gardens, and outdoor features. Open the estimator when you&apos;re ready to translate area into quantity.</p></div><Link href="/categories" className="inline-flex items-center text-sm font-semibold text-slate-950">View all materials <ArrowRight className="ml-2 h-4 w-4" /></Link></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{categoryShowcase.map((item) => <Link key={item.title} href={item.href} className="group relative min-h-[380px] overflow-hidden rounded-3xl bg-slate-900"><img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className={`absolute inset-0 bg-gradient-to-t ${item.tone} via-transparent to-transparent`} /><div className="absolute inset-x-0 bottom-0 p-7 text-white"><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-200">{item.application}</p><h3 className="mt-3 text-2xl font-semibold">{item.title}</h3><span className="mt-5 inline-flex items-center text-sm font-semibold">View collection <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></span></div></Link>)}</div>{showcaseProducts.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-3">{showcaseProducts.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"><div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-stone-100">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" /> : <span className="text-4xl">◈</span>}</div><p className="mt-4 font-semibold text-slate-950">{product.name}</p><p className="mt-1 text-sm text-slate-500">{product.materialType || "Material"} · {formatPrice(product.price)}/{product.unit || "unit"}</p></Link>)}</div>}</div></section>

      <section className="bg-slate-950 py-20 text-white"><div className="container-custom grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-300">Services that complete the plan</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Materials are only part of the project.</h2><p className="mt-5 max-w-lg leading-7 text-slate-300">Add delivery or installation during the quotation flow so the estimate reflects how you actually want the work handled.</p><Link href="/estimator" className="mt-8 inline-flex items-center rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300">Choose services <ArrowRight className="ml-2 h-4 w-4" /></Link></div><div className="grid gap-4 sm:grid-cols-2">{(services.length ? services.slice(0, 4) : [{ id: "delivery", name: "Delivery planning", description: "Choose a delivery zone and include its configured fee." }, { id: "installation", name: "Installation support", description: "Add an installation service when your project needs a helping hand." }]).map((service: any, index) => <div key={service.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">{index % 2 === 0 ? <Truck className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}</div><h3 className="mt-6 text-xl font-semibold">{service.name}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{service.description || "A configurable service option available during quotation."}</p>{service.price !== undefined && <p className="mt-5 text-sm font-semibold text-emerald-300">{formatPrice(service.price)}{service.pricingModel === "per_sqm" ? " / m²" : ""}</p>}</div>)}</div></div></section>

      <section className="bg-white py-20"><div className="container-custom"><div className="grid gap-8 lg:grid-cols-[1fr_.9fr]"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-700">Why choose us</p><h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-.03em] text-slate-950 sm:text-5xl">A practical estimate, not a guess.</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Our platform keeps the planning conversation clear: enter the area, understand the assumptions, review the options, and request a quotation that our team can confirm.</p></div><div className="grid gap-4 sm:grid-cols-2">{[{ icon: Ruler, title: "Accurate inputs", text: "Area-based calculations make the starting assumptions visible." }, { icon: ShieldCheck, title: "Clear assumptions", text: "Coverage and wastage are configured rather than hidden." }, { icon: HardHat, title: "Practical support", text: "Delivery and installation can be included in the discussion." }, { icon: Sparkles, title: "Easy quotation", text: "Turn a project idea into a structured request in minutes." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-slate-200 p-5"><Icon className="h-6 w-6 text-emerald-700" /><h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></div>; })}</div></div></div></section>

      <section className="bg-emerald-700 py-16 text-white"><div className="container-custom flex flex-col items-start justify-between gap-7 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-100">Ready when you are</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Start with your project area.</h2></div><Link href="/estimator" className="inline-flex items-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">Get your estimate <ArrowRight className="ml-2 h-4 w-4" /></Link></div></section>
    </main>
  );
}
