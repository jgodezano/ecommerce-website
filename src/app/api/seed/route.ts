import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { testimonials } from "@/data/testimonials";
import { deliveryZones } from "@/data/delivery";

export async function GET() {
  try {
    const db = getDb();

    const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
    if (userCount > 0) {
      db.prepare("UPDATE users SET account_status = 'approved' WHERE role = 'admin'").run();
      db.prepare("UPDATE users SET account_status = 'approved' WHERE role = 'customer' AND account_status IS NULL").run();
      return NextResponse.json({ message: "Database already seeded", users: userCount });
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
      "INSERT INTO categories (id, name, slug, description, image, featured, product_count) VALUES (?, ?, ?, ?, ?, ?, ?)"
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

    const projects = [
      {
        title: "Amethyst Geode Collection Display",
        description: "A stunning collection of Uruguayan amethyst geodes and slices arranged for a crystal shop display in Lipa.",
        materials: [{ productId: "amethyst-geode-slice", name: "Amethyst Geode Slice", quantity: 15, unit: "pc" }, { productId: "amethyst-cluster", name: "Amethyst Crystal Cluster", quantity: 8, unit: "pc" }],
        cost: 45000,
      },
      {
        title: "Museum-Quality Fossil Exhibit",
        description: "Curated fossil collection featuring ammonites, trilobites, and petrified wood for a museum display.",
        materials: [{ productId: "ammonite-fossil", name: "Ammonite Fossil", quantity: 12, unit: "pc" }, { productId: "trilobite-fossil", name: "Trilobite Fossil", quantity: 6, unit: "pc" }],
        cost: 180000,
      },
      {
        title: "Crystal Jewelry Collection Launch",
        description: "Handcrafted gemstone jewelry set featuring amethyst, rose quartz, and labradorite pieces for a boutique launch.",
        materials: [{ productId: "amethyst-bracelet", name: "Amethyst Beaded Bracelet", quantity: 30, unit: "pc" }, { productId: "labradorite-bracelet", name: "Labradorite Beaded Bracelet", quantity: 20, unit: "pc" }],
        cost: 95000,
      },
    ];

    const insertProject = db.prepare(
      "INSERT INTO gallery_projects (id, title, description, image, materials_used, total_cost) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const p of projects) {
      insertProject.run(crypto.randomUUID(), p.title, p.description, "", JSON.stringify(p.materials), p.cost);
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      stats: {
        users: 2,
        categories: categories.length,
        products: products.length,
        testimonials: testimonials.length,
        zones: deliveryZones.length,
        projects: projects.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
