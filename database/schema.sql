-- BuildMate Construction Supply - Database Schema
-- MySQL Database

CREATE DATABASE IF NOT EXISTS buildmate_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE buildmate_db;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(500),
  product_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_featured (featured)
) ENGINE=InnoDB;

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category_id VARCHAR(50) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  images JSON,
  weight VARCHAR(50),
  material_type VARCHAR(100),
  unit VARCHAR(50) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  wholesale_price DECIMAL(12, 2),
  min_wholesale_qty INT,
  stock INT NOT NULL DEFAULT 0,
  stock_status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'out_of_stock',
  featured BOOLEAN DEFAULT FALSE,
  best_seller BOOLEAN DEFAULT FALSE,
  delivery_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_sku (sku),
  INDEX idx_category (category_id),
  INDEX idx_stock_status (stock_status),
  INDEX idx_featured (featured),
  INDEX idx_best_seller (best_seller),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- PRODUCT SIZES
-- ============================================
CREATE TABLE product_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  dimensions VARCHAR(100),
  price DECIMAL(12, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ============================================
-- PRODUCT SPECIFICATIONS
-- ============================================
CREATE TABLE product_specifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ============================================
-- PRODUCT RELATED
-- ============================================
CREATE TABLE product_related (
  product_id VARCHAR(50) NOT NULL,
  related_product_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (product_id, related_product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- CUSTOMERS (USERS)
-- ============================================
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  customer_type ENUM('homeowner', 'contractor', 'company', 'developer') DEFAULT 'homeowner',
  email_verified_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_customer_type (customer_type)
) ENGINE=InnoDB;

-- ============================================
-- ADDRESSES
-- ============================================
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  type ENUM('shipping', 'billing') DEFAULT 'shipping',
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'Philippines',
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'on_hold') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'partial') DEFAULT 'pending',
  payment_method VARCHAR(50),
  shipping_address_id INT,
  billing_address_id INT,
  delivery_method ENUM('pickup', 'delivery', 'truck_delivery') DEFAULT 'delivery',
  delivery_date DATE,
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_number (order_number),
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  size VARCHAR(100),
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id)
) ENGINE=InnoDB;

-- ============================================
-- QUOTES
-- ============================================
CREATE TABLE quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  project_type ENUM('residential', 'commercial', 'industrial', 'infrastructure'),
  project_details TEXT,
  delivery_city VARCHAR(100),
  timeline VARCHAR(100),
  status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired', 'converted') DEFAULT 'submitted',
  subtotal DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_quote_number (quote_number),
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- QUOTE ITEMS
-- ============================================
CREATE TABLE quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  product_id VARCHAR(50),
  product_name VARCHAR(255),
  size VARCHAR(100),
  quantity INT NOT NULL,
  estimated_unit_price DECIMAL(12, 2),
  total_price DECIMAL(12, 2),
  notes TEXT,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_quote (quote_id)
) ENGINE=InnoDB;

-- ============================================
-- QUOTE FILES
-- ============================================
CREATE TABLE quote_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quote (quote_id)
) ENGINE=InnoDB;

-- ============================================
-- CART (for logged-in users)
-- ============================================
CREATE TABLE cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  size VARCHAR(100),
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_customer (customer_id),
  UNIQUE KEY unique_cart_item (customer_id, product_id, size)
) ENGINE=InnoDB;

-- ============================================
-- WISHLIST
-- ============================================
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_customer (customer_id),
  UNIQUE KEY unique_wishlist (customer_id, product_id)
) ENGINE=InnoDB;

-- ============================================
-- DELIVERY ZONES
-- ============================================
CREATE TABLE delivery_zones (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  coverage TEXT,
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  min_order_for_free DECIMAL(12, 2) DEFAULT 0,
  estimated_days VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================
-- TESTIMONIALS
-- ============================================
CREATE TABLE testimonials (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  role VARCHAR(100),
  image VARCHAR(500),
  content TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- PASSWORD RESETS
-- ============================================
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- ============================================
-- SESSIONS / TOKENS
-- ============================================
CREATE TABLE personal_access_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tokenable (tokenable_type, tokenable_id),
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (bcrypt hash)
-- ============================================
INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@buildmate.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'admin');

-- ============================================
-- INSERT DELIVERY ZONES
-- ============================================
INSERT INTO delivery_zones (id, name, coverage, fee, min_order_for_free, estimated_days) VALUES
('zone-1', 'Metro Manila', 'All cities within Metro Manila', 0, 5000, '1-2 business days'),
('zone-2', 'Provincial - Luzon (within 50km)', 'Cities within 50km of warehouse', 1500, 15000, '2-3 business days'),
('zone-3', 'Provincial - Luzon (50-150km)', 'Areas 50-150km from warehouse', 3000, 25000, '3-5 business days'),
('zone-4', 'Provincial - Luzon (150km+)', 'Areas more than 150km from warehouse', 5000, 40000, '5-7 business days'),
('zone-5', 'Visayas & Mindanao', 'Major cities (shipped via cargo)', 8000, 50000, '7-14 business days');
