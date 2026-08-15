import { getDb } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { testimonials } from "@/data/testimonials";
import { deliveryZones } from "@/data/delivery";

function seedEstimationDefaults(db: ReturnType<typeof getDb>) {
  const landscapingCategory = categories.find((category) => category.id === "landscaping-materials");
  if (landscapingCategory) {
    db.prepare("INSERT OR IGNORE INTO categories (id, name, slug, description, image, featured, product_count) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      landscapingCategory.id, landscapingCategory.name, landscapingCategory.slug, landscapingCategory.description,
      landscapingCategory.image, landscapingCategory.featured ? 1 : 0, landscapingCategory.productCount,
    );
  }

  const estimationProducts = [
    {
      id: "washed-gravel-20mm", name: "Washed Gravel 20mm", slug: "washed-gravel-20mm", sku: "LM-WG20",
      description: "Clean, rounded aggregate for garden beds, pathways, and practical low-maintenance landscaping.",
      image: "/images/home/landscape-rocks.webp", unit: "bag", price: 380, stock: 500, materialType: "Landscape gravel",
      coverage: 0.5, wastage: 10, tags: ["decorative", "pathway", "low-maintenance", "drainage"], projects: ["landscaping", "garden", "pathway", "drainage"],
      usage: "medium", finish: "natural", location: "outdoor", drainage: 1, heavyLoad: 0, color: "neutral",
    },
    {
      id: "decorative-white-pebbles", name: "Decorative White Pebbles", slug: "decorative-white-pebbles", sku: "LM-DWP01",
      description: "Bright decorative pebbles for feature beds, borders, courtyards, and clean modern garden finishes.",
      image: "/images/home/rock-garden.jpg", unit: "bag", price: 520, stock: 300, materialType: "Decorative stone",
      coverage: 0.45, wastage: 12, tags: ["decorative", "planting-bed", "low-maintenance", "modern"], projects: ["landscaping", "garden"],
      usage: "light", finish: "clean modern", location: "both", drainage: 1, heavyLoad: 0, color: "white",
    },
    {
      id: "drainage-aggregate-40mm", name: "Drainage Aggregate 40mm", slug: "drainage-aggregate-40mm", sku: "LM-DA40",
      description: "Open-graded aggregate for drainage layers, runoff control, soakaways, and erosion-prone areas.",
      image: "/images/home/landscape-stone-garden.jpg", unit: "bag", price: 430, stock: 450, materialType: "Drainage aggregate",
      coverage: 0.4, wastage: 15, tags: ["drainage", "erosion-control", "utility", "low-maintenance"], projects: ["drainage", "landscaping", "construction"],
      usage: "heavy", finish: "natural", location: "outdoor", drainage: 1, heavyLoad: 1, color: "neutral",
    },
    {
      id: "compacted-base-course", name: "Compacted Base Course", slug: "compacted-base-course", sku: "LM-CBC01",
      description: "Dense graded base material for driveways, parking areas, patios, and stable construction preparation.",
      image: "/images/home/landscape-rocks.webp", unit: "bag", price: 460, stock: 600, materialType: "Base course",
      coverage: 0.35, wastage: 15, tags: ["driveway", "walkway-base", "construction", "heavy-load"], projects: ["driveway", "pathway", "construction"],
      usage: "heavy", finish: "practical", location: "outdoor", drainage: 0, heavyLoad: 1, color: "dark",
    },
  ];

  const insertProduct = db.prepare(`INSERT OR IGNORE INTO products
    (id, name, slug, sku, category_id, description, images, specifications, sizes, weight, unit, price, stock, low_stock_threshold, stock_status, featured, best_seller, material_type, delivery_info, coverage_per_unit, wastage_percent, minimum_quantity, estimation_enabled, is_active, recommendation_tags, recommended_projects, usage_rating, finish_style, indoor_outdoor, drainage_suitable, heavy_load_suitable, color_family)
    VALUES (?, ?, ?, ?, 'landscaping-materials', ?, ?, '[]', '[]', '25kg bag', ?, ?, ?, 25, 'in_stock', 1, 1, ?, 'Available for local delivery', ?, ?, 1, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const product of estimationProducts) {
    insertProduct.run(
      product.id, product.name, product.slug, product.sku, product.description, JSON.stringify([product.image]), product.unit, product.price,
      product.stock, product.materialType, product.coverage, product.wastage, JSON.stringify(product.tags), JSON.stringify(product.projects),
      product.usage, product.finish, product.location, product.drainage, product.heavyLoad, product.color,
    );
  }

  const services = [
    ["demo-delivery", "Delivery", "Scheduled delivery to your selected project zone.", "flat", 1500, "service"],
    ["demo-installation", "Installation support", "On-site placement and basic installation support.", "per_sqm", 120, "m²"],
  ];
  const insertService = db.prepare("INSERT OR IGNORE INTO quote_services (id, name, description, pricing_model, price, unit, active) VALUES (?, ?, ?, ?, ?, ?, 1)");
  for (const service of services) insertService.run(...service);
}

export function seedDatabase() {
  const db = getDb();
  seedEstimationDefaults(db);

  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
  if (userCount > 0) {
    db.prepare("UPDATE users SET account_status = 'approved' WHERE role = 'admin'").run();
    db.prepare("UPDATE users SET account_status = 'approved' WHERE role = 'customer' AND account_status IS NULL").run();
    return;
  }

  const adminId = crypto.randomUUID();
  const adminHash = bcrypt.hashSync("admin123", 12);
  db.prepare(
    "INSERT INTO users (id, email, username, password_hash, name, first_name, last_name, role, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')"
  ).run(adminId, "admin@mericahouseofrocks.ph", "admin", adminHash, "Admin", "Admin", "", "admin");

  const demoId = crypto.randomUUID();
  const demoHash = bcrypt.hashSync("demo123", 12);
  db.prepare(
    "INSERT INTO users (id, email, username, password_hash, name, first_name, last_name, role, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')"
  ).run(demoId, "demo@mericahouseofrocks.ph", "demo", demoHash, "Demo User", "Demo", "User", "customer");

  const insertCategory = db.prepare(
    "INSERT OR IGNORE INTO categories (id, name, slug, description, image, featured, product_count) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const cat of categories) {
    insertCategory.run(cat.id, cat.name, cat.slug, cat.description, cat.image, cat.featured ? 1 : 0, cat.productCount);
  }

  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, slug, sku, category_id, description, images, specifications, sizes, weight, unit, price, wholesale_price, min_wholesale_qty, stock, low_stock_threshold, stock_status, featured, best_seller, material_type, delivery_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const prod of products) {
    insertProduct.run(
      prod.id, prod.name, prod.slug, prod.sku || "", prod.categoryId,
      prod.description, JSON.stringify(prod.images || []), JSON.stringify(prod.specifications || []),
      JSON.stringify(prod.sizes || []), prod.weight || "", prod.unit || "pc",
      prod.price, prod.wholesalePrice || null, prod.minWholesaleQty || null,
      prod.stock || 0, 50, prod.stockStatus || "in_stock",
      prod.featured ? 1 : 0, prod.bestSeller ? 1 : 0,
      prod.materialType || "", prod.deliveryInfo || ""
    );
  }

  const insertTestimonial = db.prepare(
    "INSERT INTO testimonials (id, name, role, content, rating, avatar) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const t of testimonials) {
      insertTestimonial.run(crypto.randomUUID(), t.name, t.role || "", t.content, t.rating, t.image || "");
  }

  const insertZone = db.prepare(
    "INSERT INTO delivery_zones (id, name, fee, min_order_for_free, estimated_days) VALUES (?, ?, ?, ?, ?)"
  );
  for (const z of deliveryZones) {
    insertZone.run(z.id, z.name, z.fee, z.minOrderForFree || null, z.estimatedDays);
  }

  const galleryProjects = [
    {
      title: "Amethyst Geode Collection Display",
      description: "A stunning collection of Uruguayan amethyst geodes and slices arranged for a crystal shop display in Lipa.",
      materials_used: [
        { productId: "amethyst-geode-slice", name: "Amethyst Geode Slice", quantity: 15, unit: "pc" },
        { productId: "amethyst-cluster", name: "Amethyst Crystal Cluster", quantity: 8, unit: "pc" },
      ],
      total_cost: 45000,
    },
    {
      title: "Museum-Quality Fossil Exhibit",
      description: "Curated fossil collection featuring ammonites, trilobites, and petrified wood for a museum display.",
      materials_used: [
        { productId: "ammonite-fossil", name: "Ammonite Fossil", quantity: 12, unit: "pc" },
        { productId: "trilobite-fossil", name: "Trilobite Fossil", quantity: 6, unit: "pc" },
      ],
      total_cost: 180000,
    },
    {
      title: "Crystal Jewelry Collection Launch",
      description: "Handcrafted gemstone jewelry set featuring amethyst, rose quartz, and labradorite pieces for a boutique launch.",
      materials_used: [
        { productId: "amethyst-bracelet", name: "Amethyst Beaded Bracelet", quantity: 30, unit: "pc" },
        { productId: "labradorite-bracelet", name: "Labradorite Beaded Bracelet", quantity: 20, unit: "pc" },
      ],
      total_cost: 95000,
    },
  ];

  const insertGallery = db.prepare(
    "INSERT INTO gallery_projects (id, title, description, image, materials_used, total_cost) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const proj of galleryProjects) {
    insertGallery.run(crypto.randomUUID(), proj.title, proj.description, "", JSON.stringify(proj.materials_used), proj.total_cost);
  }
}
