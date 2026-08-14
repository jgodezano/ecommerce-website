import type Database from "better-sqlite3";

function columnExists(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

export function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin','customer')),
      phone TEXT DEFAULT '',
      company_name TEXT DEFAULT '',
      account_status TEXT NOT NULL DEFAULT 'pending' CHECK(account_status IN ('pending','approved','rejected','suspended')),
      identity_document TEXT DEFAULT '',
      rejection_reason TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      product_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT DEFAULT '',
      category_id TEXT REFERENCES categories(id),
      description TEXT DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      specifications TEXT NOT NULL DEFAULT '[]',
      sizes TEXT NOT NULL DEFAULT '[]',
      weight TEXT DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'pc',
      price REAL NOT NULL DEFAULT 0,
      wholesale_price REAL DEFAULT NULL,
      min_wholesale_qty INTEGER DEFAULT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 50,
      stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK(stock_status IN ('in_stock','low_stock','out_of_stock','pre_order')),
      featured INTEGER NOT NULL DEFAULT 0,
      best_seller INTEGER NOT NULL DEFAULT 0,
      material_type TEXT DEFAULT '',
      delivery_info TEXT DEFAULT '',
      coverage_per_unit REAL DEFAULT NULL,
      wastage_percent REAL NOT NULL DEFAULT 0,
      minimum_quantity INTEGER NOT NULL DEFAULT 1,
      estimation_enabled INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','ready_for_delivery','out_for_delivery','delivered','completed','cancelled')),
      subtotal REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      shipping REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','refunded')),
      delivery_method TEXT DEFAULT 'delivery',
      shipping_address TEXT DEFAULT '{}',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      size TEXT DEFAULT '',
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      quote_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','quoted','accepted','rejected')),
      items TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      project_details TEXT DEFAULT '{}',
      admin_notes TEXT DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
      area_sqm REAL DEFAULT NULL,
      selected_material_id TEXT DEFAULT NULL,
      material_total REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0,
      service_total REAL NOT NULL DEFAULT 0,
      other_charges REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      services TEXT NOT NULL DEFAULT '[]',
      customer_name TEXT DEFAULT '',
      customer_email TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      project_location TEXT DEFAULT '',
      timeline TEXT DEFAULT '',
      workflow_status TEXT NOT NULL DEFAULT 'pending',
      estimate_disclaimer TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT DEFAULT 'Home',
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gallery_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      materials_used TEXT NOT NULL DEFAULT '[]',
      total_cost REAL DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      content TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      avatar TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS delivery_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fee REAL NOT NULL DEFAULT 0,
      min_order_for_free REAL DEFAULT NULL,
      estimated_days TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS quote_services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      pricing_model TEXT NOT NULL DEFAULT 'flat' CHECK(pricing_model IN ('flat','per_sqm')),
      price REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'service',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity_change INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
  `);

  const migrations: [string, string, string][] = [
    ["users", "username", "ALTER TABLE users ADD COLUMN username TEXT UNIQUE NOT NULL DEFAULT ''"],
    ["users", "company_name", "ALTER TABLE users ADD COLUMN company_name TEXT DEFAULT ''"],
    ["users", "account_status", "ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'approved'"],
    ["users", "identity_document", "ALTER TABLE users ADD COLUMN identity_document TEXT DEFAULT ''"],
    ["users", "rejection_reason", "ALTER TABLE users ADD COLUMN rejection_reason TEXT DEFAULT ''"],
    ["products", "coverage_per_unit", "ALTER TABLE products ADD COLUMN coverage_per_unit REAL DEFAULT NULL"],
    ["products", "wastage_percent", "ALTER TABLE products ADD COLUMN wastage_percent REAL NOT NULL DEFAULT 0"],
    ["products", "minimum_quantity", "ALTER TABLE products ADD COLUMN minimum_quantity INTEGER NOT NULL DEFAULT 1"],
    ["products", "estimation_enabled", "ALTER TABLE products ADD COLUMN estimation_enabled INTEGER NOT NULL DEFAULT 0"],
    ["products", "is_active", "ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"],
    ["quotes", "area_sqm", "ALTER TABLE quotes ADD COLUMN area_sqm REAL DEFAULT NULL"],
    ["quotes", "selected_material_id", "ALTER TABLE quotes ADD COLUMN selected_material_id TEXT DEFAULT NULL"],
    ["quotes", "material_total", "ALTER TABLE quotes ADD COLUMN material_total REAL NOT NULL DEFAULT 0"],
    ["quotes", "delivery_fee", "ALTER TABLE quotes ADD COLUMN delivery_fee REAL NOT NULL DEFAULT 0"],
    ["quotes", "service_total", "ALTER TABLE quotes ADD COLUMN service_total REAL NOT NULL DEFAULT 0"],
    ["quotes", "other_charges", "ALTER TABLE quotes ADD COLUMN other_charges REAL NOT NULL DEFAULT 0"],
    ["quotes", "discount", "ALTER TABLE quotes ADD COLUMN discount REAL NOT NULL DEFAULT 0"],
    ["quotes", "services", "ALTER TABLE quotes ADD COLUMN services TEXT NOT NULL DEFAULT '[]'"],
    ["quotes", "customer_name", "ALTER TABLE quotes ADD COLUMN customer_name TEXT DEFAULT ''"],
    ["quotes", "customer_email", "ALTER TABLE quotes ADD COLUMN customer_email TEXT DEFAULT ''"],
    ["quotes", "customer_phone", "ALTER TABLE quotes ADD COLUMN customer_phone TEXT DEFAULT ''"],
    ["quotes", "project_location", "ALTER TABLE quotes ADD COLUMN project_location TEXT DEFAULT ''"],
    ["quotes", "timeline", "ALTER TABLE quotes ADD COLUMN timeline TEXT DEFAULT ''"],
    ["quotes", "workflow_status", "ALTER TABLE quotes ADD COLUMN workflow_status TEXT NOT NULL DEFAULT 'pending'"],
    ["quotes", "estimate_disclaimer", "ALTER TABLE quotes ADD COLUMN estimate_disclaimer TEXT DEFAULT ''"],
  ];

  for (const [table, column, sql] of migrations) {
    if (!columnExists(db, table, column)) {
      try {
        db.exec(sql);
      } catch {}
    }
  }

  // Create indexes only after migrations, because existing installations may have older tables.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quotes_workflow_status ON quotes(workflow_status);
    CREATE INDEX IF NOT EXISTS idx_products_estimation ON products(estimation_enabled, is_active);
    CREATE INDEX IF NOT EXISTS idx_quote_services_active ON quote_services(active);
  `);
}
