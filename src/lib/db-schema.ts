import type Database from "better-sqlite3";

export function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin','customer')),
      phone TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
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
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','approved','rejected','converted')),
      items TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      project_details TEXT DEFAULT '{}',
      admin_notes TEXT DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
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
}
