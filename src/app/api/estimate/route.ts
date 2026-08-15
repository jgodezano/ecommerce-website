import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateQuoteTotals, calculateServiceCost, estimateMaterialForArea, scoreMaterialMatch, type ProjectProfile } from "@/lib/estimator";

function json(value: any, fallback: any) {
  if (!value) return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return fallback; }
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

    const products = (db.prepare(query).all(...params) as any[]).map((row) => {
      const material = {
        id: row.id,
        name: row.name,
        description: row.description || "",
        image: json(row.images, [])[0] || "",
        unit: row.unit || "unit",
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
      };
      const estimate = estimateMaterialForArea(areaSqm, material);
      if (!estimate) return null;
      const match = scoreMaterialMatch(material, projectProfile);
      return { ...material, matchScore: match.score, matchReasons: match.reasons, estimate };
    }).filter(Boolean).sort((a: any, b: any) => {
      if (projectProfile) return (b.matchScore || 0) - (a.matchScore || 0) || b.estimate.materialTotal - a.estimate.materialTotal;
      return Number(b.bestSeller || 0) - Number(a.bestSeller || 0) || a.name.localeCompare(b.name);
    });

    const projectTypeForShortlist = String(projectProfile?.projectType || "").toLowerCase();
    const minimumMatchScore = ["landscaping", "garden", "terrace", "wall", "construction", "drainage", "driveway", "pathway"].some((value) => projectTypeForShortlist.includes(value)) ? 8 : 6;
    const recommendedProducts = projectProfile
      ? products.filter((product: any) => Number(product.matchScore || 0) >= minimumMatchScore).slice(0, 4)
      : products.slice(0, 6);
    const shortlist = recommendedProducts.length ? recommendedProducts : products.slice(0, 3);

    const serviceIds = Array.isArray(body.serviceIds) ? body.serviceIds.map(String) : [];
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
        score = projectType.includes("terrace") || projectType.includes("patio") || customProject.includes("terrace") || customProject.includes("patio") || constructionMethod === "surface" ? 16 : 0;
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
    const preliminaryMaterialTotal = selected?.estimate.materialTotal || 0;
    const configuredDeliveryFee = zone ? (zone.min_order_for_free && preliminaryMaterialTotal >= Number(zone.min_order_for_free) ? 0 : Number(zone.fee || 0)) : Number(body.deliveryFee || 0);
    const totals = calculateQuoteTotals({
      materialTotal: preliminaryMaterialTotal,
      deliveryFee: configuredDeliveryFee,
      serviceTotal: selectedServices.reduce((sum, service) => sum + service.total, 0),
      otherCharges: Number(body.otherCharges || 0),
      discount: Number(body.discount || 0),
    });

    return NextResponse.json({ areaSqm, recommendations: shortlist, services, recommendedServiceIds, selectedServiceIds: serviceIds, selectedProductId: selected?.id || null, deliveryZone: zone ? { id: zone.id, name: zone.name, fee: Number(zone.fee || 0), minOrderForFree: Number(zone.min_order_for_free || 0), estimatedDays: zone.estimated_days || "" } : null, totals });
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json({ error: "Unable to calculate estimate" }, { status: 500 });
  }
}
