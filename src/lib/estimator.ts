export interface WallDimensions {
  length: number; // meters
  height: number; // meters
  thickness: "4" | "6" | "8"; // inches
}

export interface FloorDimensions {
  length: number;
  width: number;
  thickness: number; // cm
}

export interface MaterialEstimate {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
  image?: string;
  description?: string;
  coveragePerUnit?: number;
  wastagePercent?: number;
}

export interface ConfigurableMaterial {
  id: string;
  name: string;
  description?: string;
  image?: string;
  unit: string;
  price: number;
  coveragePerUnit: number | null;
  wastagePercent: number;
  minimumQuantity: number;
  estimationEnabled: boolean;
}

export interface ConfigurableService {
  id: string;
  name: string;
  description?: string;
  pricingModel: "flat" | "per_sqm";
  price: number;
  unit: string;
}

export interface AreaEstimate {
  areaSqm: number;
  baseQuantity: number;
  recommendedQuantity: number;
  unit: string;
  unitPrice: number;
  materialTotal: number;
  wastagePercent: number;
  coveragePerUnit: number;
}

export interface QuoteTotals {
  materialTotal: number;
  deliveryFee: number;
  serviceTotal: number;
  otherCharges: number;
  discount: number;
  total: number;
} 

export function estimateMaterialForArea(areaSqm: number, material: ConfigurableMaterial): AreaEstimate | null {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0 || !material.estimationEnabled || !material.coveragePerUnit || material.coveragePerUnit <= 0) {
    return null;
  }

  const baseQuantity = areaSqm / material.coveragePerUnit;
  const withWastage = baseQuantity * (1 + Math.max(0, material.wastagePercent || 0) / 100);
  const recommendedQuantity = Math.max(material.minimumQuantity || 1, Math.ceil(withWastage));

  return {
    areaSqm,
    baseQuantity,
    recommendedQuantity,
    unit: material.unit || "unit",
    unitPrice: Number(material.price || 0),
    materialTotal: recommendedQuantity * Number(material.price || 0),
    wastagePercent: Math.max(0, material.wastagePercent || 0),
    coveragePerUnit: material.coveragePerUnit,
  };
}

export function calculateServiceCost(service: ConfigurableService, areaSqm: number): number {
  const multiplier = service.pricingModel === "per_sqm" ? areaSqm : 1;
  return Math.max(0, Number(service.price || 0)) * multiplier;
}

export function calculateQuoteTotals(input: {
  materialTotal: number;
  deliveryFee?: number;
  serviceTotal?: number;
  otherCharges?: number;
  discount?: number;
}): QuoteTotals {
  const materialTotal = Math.max(0, Number(input.materialTotal || 0));
  const deliveryFee = Math.max(0, Number(input.deliveryFee || 0));
  const serviceTotal = Math.max(0, Number(input.serviceTotal || 0));
  const otherCharges = Math.max(0, Number(input.otherCharges || 0));
  const discount = Math.min(materialTotal + deliveryFee + serviceTotal + otherCharges, Math.max(0, Number(input.discount || 0)));

  return {
    materialTotal,
    deliveryFee,
    serviceTotal,
    otherCharges,
    discount,
    total: materialTotal + deliveryFee + serviceTotal + otherCharges - discount,
  };
}

export interface EstimationResult {
  materials: MaterialEstimate[];
  subtotal: number;
  wasteFactor: number;
  notes: string[];
}

const WASTE_FACTOR = 1.1;

const BLOCK_SIZES: Record<string, { area: number; mortar: number }> = {
  "4": { area: 0.1, mortar: 0.012 },
  "6": { area: 0.1, mortar: 0.018 },
  "8": { area: 0.1, mortar: 0.024 },
};

const CONCRETE_MIX = {
  cement: { ratio: 1, unit: "bag", bagSize: 50, kgPerBag: 50 },
  sand: { ratio: 2, unit: "cu.m." },
  gravel: { ratio: 4, unit: "cu.m." },
};

const PRICES = {
  hollowBlock4: 18,
  hollowBlock6: 22,
  hollowBlock8: 28,
  cement: 250,
  sand: 1200,
  gravel: 1500,
  steel: 65,
  plywood: 650,
  curingCompound: 350,
};

export function estimateWall(dims: WallDimensions): EstimationResult {
  const lengthM = dims.length;
  const heightM = dims.height;
  const wallArea = lengthM * heightM;
  const thickness = dims.thickness;

  const block = BLOCK_SIZES[thickness];
  const blockQty = Math.ceil((wallArea / block.area) * WASTE_FACTOR);

  const mortarVol = wallArea * block.mortar;
  const cementBags = Math.ceil(mortarVol / 0.035 * 1.5);
  const sandVol = Math.ceil(mortarVol * 1.2 * 100) / 100;

  const blockPrice = thickness === "4" ? PRICES.hollowBlock4 : thickness === "6" ? PRICES.hollowBlock6 : PRICES.hollowBlock8;
  const productId = thickness === "4" ? "hollow-block-4" : thickness === "6" ? "hollow-block-6" : "hollow-block-8";

  const materials: MaterialEstimate[] = [
    {
      name: `Hollow Blocks (${thickness}")`,
      quantity: blockQty,
      unit: "pc",
      unitPrice: blockPrice,
      totalPrice: blockQty * blockPrice,
      productId,
    },
    {
      name: "Cement (50kg bag)",
      quantity: cementBags,
      unit: "bag",
      unitPrice: PRICES.cement,
      totalPrice: cementBags * PRICES.cement,
    },
    {
      name: "Sand",
      quantity: sandVol,
      unit: "cu.m.",
      unitPrice: PRICES.sand,
      totalPrice: Math.ceil(sandVol * PRICES.sand),
    },
  ];

  const subtotal = materials.reduce((s, m) => s + m.totalPrice, 0);

  return {
    materials,
    subtotal,
    wasteFactor: WASTE_FACTOR,
    notes: [
      `Based on ${lengthM}m x ${heightM}m wall, ${thickness}" thick`,
      `Includes ${Math.round((WASTE_FACTOR - 1) * 100)}% waste factor`,
      "Excludes reinforcement steel, labor, and finishing",
    ],
  };
}

export function estimateFloorSlab(dims: FloorDimensions): EstimationResult {
  const vol = dims.length * dims.width * (dims.thickness / 100);
  const volWaste = vol * WASTE_FACTOR;

  const totalRatio = CONCRETE_MIX.cement.ratio + CONCRETE_MIX.sand.ratio + CONCRETE_MIX.gravel.ratio;
  const cementVol = (CONCRETE_MIX.cement.ratio / totalRatio) * volWaste;
  const sandVol = (CONCRETE_MIX.sand.ratio / totalRatio) * volWaste;
  const gravelVol = (CONCRETE_MIX.gravel.ratio / totalRatio) * volWaste;

  const cementBags = Math.ceil(cementVol / 0.035);
  const sandM3 = Math.ceil(sandVol * 100) / 100;
  const gravelM3 = Math.ceil(gravelVol * 100) / 100;

  const materials: MaterialEstimate[] = [
    {
      name: "Portland Cement (50kg)",
      quantity: cementBags,
      unit: "bag",
      unitPrice: PRICES.cement,
      totalPrice: cementBags * PRICES.cement,
    },
    {
      name: "Sand",
      quantity: sandM3,
      unit: "cu.m.",
      unitPrice: PRICES.sand,
      totalPrice: Math.ceil(sandM3 * PRICES.sand),
    },
    {
      name: "Gravel",
      quantity: gravelM3,
      unit: "cu.m.",
      unitPrice: PRICES.gravel,
      totalPrice: Math.ceil(gravelM3 * PRICES.gravel),
    },
  ];

  const subtotal = materials.reduce((s, m) => s + m.totalPrice, 0);

  return {
    materials,
    subtotal,
    wasteFactor: WASTE_FACTOR,
    notes: [
      `Based on ${dims.length}m x ${dims.width}m x ${dims.thickness}cm slab`,
      `Class A mix (1:2:4 cement:sand:gravel)`,
      `Concrete volume: ${vol.toFixed(2)} cu.m.`,
      "Excludes reinforcement steel, labor, and finishing",
    ],
  };
}

export function estimateColumn(height: number, width: number, depth: number): EstimationResult {
  const vol = height * (width / 100) * (depth / 100);
  const volWaste = vol * WASTE_FACTOR;

  const totalRatio = CONCRETE_MIX.cement.ratio + CONCRETE_MIX.sand.ratio + CONCRETE_MIX.gravel.ratio;
  const cementVol = (CONCRETE_MIX.cement.ratio / totalRatio) * volWaste;
  const sandVol = (CONCRETE_MIX.sand.ratio / totalRatio) * volWaste;
  const gravelVol = (CONCRETE_MIX.gravel.ratio / totalRatio) * volWaste;

  const cementBags = Math.ceil(cementVol / 0.035);
  const sandM3 = Math.ceil(sandVol * 100) / 100;
  const gravelM3 = Math.ceil(gravelVol * 100) / 100;

  const steelQty = Math.ceil((height / 0.2) * 4 + height * 0.04);

  const materials: MaterialEstimate[] = [
    {
      name: "Portland Cement (50kg)",
      quantity: cementBags,
      unit: "bag",
      unitPrice: PRICES.cement,
      totalPrice: cementBags * PRICES.cement,
    },
    {
      name: "Sand",
      quantity: sandM3,
      unit: "cu.m.",
      unitPrice: PRICES.sand,
      totalPrice: Math.ceil(sandM3 * PRICES.sand),
    },
    {
      name: "Gravel",
      quantity: gravelM3,
      unit: "cu.m.",
      unitPrice: PRICES.gravel,
      totalPrice: Math.ceil(gravelM3 * PRICES.gravel),
    },
    {
      name: "Reinforcement Steel (12mm)",
      quantity: steelQty,
      unit: "length",
      unitPrice: PRICES.steel,
      totalPrice: steelQty * PRICES.steel,
    },
  ];

  const subtotal = materials.reduce((s, m) => s + m.totalPrice, 0);

  return {
    materials,
    subtotal,
    wasteFactor: WASTE_FACTOR,
    notes: [
      `Column: ${width}cm x ${depth}cm x ${height}m`,
      "Includes 4 main bars + ties at 20cm spacing",
      "Excludes labor and finishing",
    ],
  };
}
