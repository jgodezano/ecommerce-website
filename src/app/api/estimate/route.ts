import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateQuoteTotals, calculateServiceCost, estimateMaterialForArea, scoreMaterialMatch, compareEstimateToBudget, estimateProjectDuration, type ProjectProfile } from "@/lib/estimator";

function json(value: any, fallback: any) {
  if (!value) return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return fallback; }
}

type SystemKind = "landscape" | "parking" | "terrace" | "wall" | "drainage" | "construction";
type SystemRole = "base" | "binder" | "masonry" | "surface" | "drainage" | "decorative";

function getProjectSystem(profile?: Partial<ProjectProfile>): { kind: SystemKind; name: string; purpose: string; allowedRoles: SystemRole[] } {
  const rawProjectType = String(profile?.projectType || "").toLowerCase();
  const custom = `${rawProjectType.replace(/^other:\s*/, "")} ${String((profile as any)?.customProject || "")}`.toLowerCase();
  const useCase = String(profile?.useCase || "").toLowerCase();
  const method = String((profile as any)?.constructionMethod || "").toLowerCase();
  const text = `${rawProjectType} ${custom} ${useCase} ${method}`;

  if (/parking|driveway|car|vehicle/.test(text)) {
    return { kind: "parking", name: "Parking / driveway material system", purpose: "A stable vehicle-rated foundation with a practical surface finish. Decorative pebbles and drainage aggregate are excluded unless drainage is the stated need.", allowedRoles: ["base", "binder", "surface"] };
  }
  if (/drainage|erosion|runoff|soakaway/.test(text) || profile?.drainagePriority === "high") {
    return { kind: "drainage", name: "Drainage and erosion-control system", purpose: "An open drainage layer and supporting aggregate system for moving water and protecting exposed soil.", allowedRoles: ["drainage", "base"] };
  }
  if (/wall|masonry|retaining|repair|fix/.test(text) || useCase === "repair-fix") {
    return { kind: "wall", name: "Wall repair / masonry system", purpose: "Masonry units, binder, and sand for repair, blockwork, retaining-wall, and small structural work.", allowedRoles: ["masonry", "binder"] };
  }
  if (/terrace|patio/.test(text)) {
    return { kind: "terrace", name: "Terrace / patio material system", purpose: "A prepared base, binder or leveling layer, and suitable outdoor surface materials for a new terrace or patio.", allowedRoles: ["base", "binder", "surface"] };
  }
  if (/construction|foundation|structural|build-new/.test(text)) {
    return { kind: "construction", name: "General construction-base system", purpose: "A practical base and binder system for a new construction area when the final finish is not yet selected.", allowedRoles: ["base", "binder", "masonry", "surface"] };
  }
  return { kind: "landscape", name: "Landscape and decorative surface system", purpose: "Decorative and low-maintenance landscape materials for planting beds, borders, and garden features.", allowedRoles: ["decorative", "surface"] };
}

function getMaterialRole(material: any): SystemRole {
  const text = `${material.id} ${material.name} ${material.materialType || ""} ${(material.recommendationTags || []).join(" ")}`.toLowerCase();
  if (/drainage|erosion/.test(text)) return "drainage";
  if (/cement|binder|mortar|sand/.test(text)) return "binder";
  if (/base course|base-course|foundation|walkway-base|compacted-base/.test(text)) return "base";
  if (/hollow block|masonry block|block|masonry/.test(text)) return "masonry";
  if (/surface|driveway|parking|heavy-load/.test(text)) return "surface";
  if (/decorative|pebble|landscape|planting-bed|garden/.test(text)) return "decorative";
  return "surface";
}

function isSystemCompatible(product: any, system: ReturnType<typeof getProjectSystem>, profile?: Partial<ProjectProfile>): boolean {
  const role = product.systemRole as SystemRole;
  const tags = (product.recommendationTags || []).map((tag: string) => tag.toLowerCase());
  const drainageRequested = profile?.drainagePriority === "high" || system.kind === "drainage";
  if (!system.allowedRoles.includes(role)) return false;
  if (system.kind === "parking") {
    if (role === "decorative" || role === "drainage") return false;
    if (role === "surface" && !tags.some((tag: string) => ["heavy-load", "driveway", "construction", "structural", "pathway"].some((wanted) => tag.includes(wanted)))) return false;
  }
  if (system.kind === "landscape" && (role === "base" || role === "binder" || role === "masonry" || role === "drainage")) return false;
  if (!drainageRequested && role === "drainage") return false;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const areaSqm = Number(body.areaSqm);
    if (!Number.isFinite(areaSqm) || areaSqm <= 0 || areaSqm > 1_000_000) {
      return NextResponse.json({ error: "Enter a valid area in square meters" }, { status: 400 });
    }

    const db = getDb();
    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const projectProfile = body.projectProfile && typeof body.projectProfile === "object" ? body.projectProfile as Partial<ProjectProfile> : undefined;
    const params: any[] = [];
    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE COALESCE(p.is_active, 1) = 1 AND COALESCE(p.estimation_enabled, 0) = 1
        AND COALESCE(p.stock, 0) > 0
        AND p.coverage_per_unit IS NOT NULL AND p.coverage_per_unit > 0
    `;
    if (categoryId) {
      query += " AND p.category_id = ?";
      params.push(categoryId);
    }
    query += " ORDER BY p.best_seller DESC, p.name ASC";

    const system = getProjectSystem(projectProfile);
    const products = (db.prepare(query).all(...params) as any[]).map((row) => {
      const material: any = {
        id: row.id,
        name: row.name,
        description: row.description || "",
        image: json(row.images, [])[0] || "",
        unit: row.unit || "unit",
        packageSize: row.weight || "",
        price: Number(row.price || 0),
        coveragePerUnit: Number(row.coverage_per_unit),
        wastagePercent: Number(row.wastage_percent || 0),
        minimumQuantity: Number(row.minimum_quantity || 1),
        estimationEnabled: !!row.estimation_enabled,
        recommendationTags: json(row.recommendation_tags, []),
        recommendedProjects: json(row.recommended_projects, []),
        usageRating: row.usage_rating || "light",
        finishStyle: row.finish_style || "",
        indoorOutdoor: row.indoor_outdoor || "both",
        drainageSuitable: !!row.drainage_suitable,
        heavyLoadSuitable: !!row.heavy_load_suitable,
        colorFamily: row.color_family || "",
        stock: Number(row.stock || 0),
        materialType: row.material_type || "",
      };
      material.systemRole = getMaterialRole(material);
      const estimate = estimateMaterialForArea(areaSqm, material);
      if (!estimate) return null;
      const match = scoreMaterialMatch(material, projectProfile);
      const systemCompatible = isSystemCompatible(material, system, projectProfile);
      return { ...material, matchScore: match.score, matchReasons: match.reasons, systemRole: material.systemRole, systemCompatible, estimate };
    }).filter(Boolean).sort((a: any, b: any) => {
      if (projectProfile) return Number(b.systemCompatible) - Number(a.systemCompatible) || (b.matchScore || 0) - (a.matchScore || 0) || b.estimate.materialTotal - a.estimate.materialTotal;
      return Number(b.bestSeller || 0) - Number(a.bestSeller || 0) || a.name.localeCompare(b.name);
    });

    const systemProducts = projectProfile ? products.filter((product: any) => product.systemCompatible) : products;
    const fallbackProducts = projectProfile && system.kind === "landscape" ? products.filter((product: any) => product.systemRole === "decorative" || product.systemRole === "surface") : products;
    const shortlist = (systemProducts.length ? systemProducts : fallbackProducts).slice(0, system.kind === "wall" ? 4 : 5);

    const serviceIds = Array.isArray(body.serviceIds) ? body.serviceIds.map(String) : [];
    const targetBudget = Number(body.targetBudget || (projectProfile as any)?.budgetTarget || 0);
    const selectedServiceSet = new Set(serviceIds);
    const rawProjectType = String(projectProfile?.projectType || "").toLowerCase();
    const customProject = `${rawProjectType.replace(/^other:\s*/, "")} ${String((projectProfile as any)?.customProject || "")}`.toLowerCase();
    const projectType = rawProjectType.startsWith("other:") ? "other" : rawProjectType;
    const useCase = String(projectProfile?.useCase || "").toLowerCase();
    const constructionMethod = String((projectProfile as any)?.constructionMethod || "").toLowerCase();
    const serviceRows = db.prepare("SELECT * FROM quote_services WHERE active = 1 ORDER BY name ASC").all() as any[];
    const scoreService = (row: any) => {
      const id = String(row.id);
      const name = String(row.name || "").toLowerCase();
      let score = 0;
      let reason = "Available as an optional service from Merica.";
      if (id === "demo-delivery" || name.includes("deliver")) { score = 5; reason = "Useful when materials need to be brought to the project site."; }
      if (id === "demo-landscape-installation" || name.includes("landscap")) {
        score = ["landscaping", "garden", "pathway"].includes(projectType) || ["decorative", "maintenance"].includes(useCase) ? 14 : 0;
        reason = "Matches an outdoor landscape, garden, or decorative installation.";
      }
      if (id === "demo-site-preparation" || name.includes("site preparation")) {
        score = ["driveway", "pathway", "construction", "terrace"].includes(projectType) || ["build-new", "structural"].includes(useCase) ? 13 : 0;
        reason = "Useful before a new base, terrace, patio, or finished surface is installed.";
      }
      if (id === "demo-masonry-wall-work" || name.includes("masonry") || name.includes("wall")) {
        score = customProject.includes("wall") || customProject.includes("repair") || useCase === "repair-fix" || useCase === "structural" ? 16 : 0;
        reason = "Matches wall repair, masonry, retaining, and small structural work.";
      }
      if (id === "demo-terrace-construction" || name.includes("terrace") || name.includes("patio")) {
        score = projectType.includes("terrace") || projectType.includes("patio") || customProject.includes("terrace") || customProject.includes("patio") ? 16 : 0;
        reason = "Matches a new terrace, patio, or finished outdoor platform.";
      }
      if (id === "demo-installation" || name.includes("placement")) {
        score = score || (["landscaping", "garden", "pathway", "driveway", "construction", "other"].includes(projectType) ? 8 : 4);
        reason = "Optional on-site placement and installation support for the selected materials.";
      }
      return { score, reason };
    };
    const services = serviceRows.map((row) => {
      const service = { id: row.id, name: row.name, description: row.description || "", pricingModel: row.pricing_model, price: Number(row.price || 0), unit: row.unit || "service" };
      const match = scoreService(row);
      const selected = selectedServiceSet.has(String(row.id));
      const deliveryHandledByZone = String(row.id) === "demo-delivery" && Boolean(body.deliveryZoneId);
      return { ...service, recommended: match.score >= 8 || String(row.id) === "demo-delivery", recommendationReason: match.reason, selected, total: selected && !deliveryHandledByZone ? calculateServiceCost(service, areaSqm) : 0, matchScore: match.score };
    }).sort((a, b) => Number(b.recommended) - Number(a.recommended) || b.matchScore - a.matchScore || a.name.localeCompare(b.name));
    const recommendedServiceIds = services.filter((service) => service.recommended).map((service) => service.id);
    const selectedServices = services.filter((service) => service.selected);

    const selected = shortlist.find((item: any) => item.id === body.selectedProductId) || shortlist[0] || null;
    const zone = body.deliveryZoneId ? db.prepare("SELECT * FROM delivery_zones WHERE id = ?").get(String(body.deliveryZoneId)) as any : null;
    const systemMaterialTotal = shortlist.reduce((sum: number, item: any) => sum + Number(item.estimate.materialTotal || 0), 0);
    const preliminaryMaterialTotal = systemMaterialTotal || selected?.estimate.materialTotal || 0;
    const configuredDeliveryFee = zone ? (zone.min_order_for_free && preliminaryMaterialTotal >= Number(zone.min_order_for_free) ? 0 : Number(zone.fee || 0)) : Number(body.deliveryFee || 0);
    const totals = calculateQuoteTotals({
      materialTotal: preliminaryMaterialTotal,
      deliveryFee: configuredDeliveryFee,
      serviceTotal: selectedServices.reduce((sum, service) => sum + service.total, 0),
      otherCharges: Number(body.otherCharges || 0),
      discount: Number(body.discount || 0),
    });
    const budgetComparison = compareEstimateToBudget(totals.total, targetBudget);
    const estimatedDuration = estimateProjectDuration(areaSqm, projectProfile, serviceIds);

    const recommendations = shortlist.map((item: any, index: number) => ({
      ...item,
      systemRole: item.systemRole,
      systemRequired: system.kind !== "landscape" && ["base", "binder", "masonry", "surface"].includes(item.systemRole),
      purpose: item.systemRole === "base" ? "Foundation layer: spreads vehicle or structural load and reduces settlement." : item.systemRole === "binder" ? "Binder or leveling material: helps bind, level, or prepare the construction layer." : item.systemRole === "masonry" ? "Masonry unit: forms the wall, partition, retaining, or structural element." : item.systemRole === "drainage" ? "Drainage layer: provides a path for water and helps control runoff." : item.systemRole === "decorative" ? "Visible finish: provides the color, texture, and garden appearance." : "Surface aggregate: provides the visible or compacted outdoor finish.",
    }));
    return NextResponse.json({ areaSqm, system: { kind: system.kind, name: system.name, purpose: system.purpose }, recommendations, services, recommendedServiceIds, selectedServiceIds: serviceIds, selectedProductId: selected?.id || null, deliveryZone: zone ? { id: zone.id, name: zone.name, fee: Number(zone.fee || 0), minOrderForFree: Number(zone.min_order_for_free || 0), estimatedDays: zone.estimated_days || "" } : null, totals, budgetComparison, estimatedDuration });
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json({ error: "Unable to calculate estimate" }, { status: 500 });
  }
}
