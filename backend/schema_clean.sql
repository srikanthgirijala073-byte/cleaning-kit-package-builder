-- ============================================================
-- Cleaning Kit Package Builder - Complete Database Schema
-- Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS cleaning_kit_db;
USE cleaning_kit_db;

-- =======================
-- USERS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL,
  google_id VARCHAR(255) UNIQUE DEFAULT NULL,
  github_id VARCHAR(255) UNIQUE DEFAULT NULL,
  microsoft_id VARCHAR(255) UNIQUE DEFAULT NULL,
  phone VARCHAR(50) DEFAULT '',
  address TEXT,
  profile_image VARCHAR(500) DEFAULT '',
  role ENUM('admin', 'manager', 'staff', 'customer') DEFAULT 'customer',
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  login_notifications_enabled BOOLEAN DEFAULT TRUE,
  failed_login_attempts INT DEFAULT 0,
  account_locked BOOLEAN DEFAULT FALSE,
  lock_until TIMESTAMP NULL DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- EMAIL VERIFICATION TOKENS
-- =======================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_token (token(255)),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- PASSWORD RESET TOKENS
-- =======================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- REFRESH TOKENS (for JWT refresh)
-- =======================
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  device_name VARCHAR(100) DEFAULT '',
  browser VARCHAR(100) DEFAULT '',
  ip_address VARCHAR(45) DEFAULT '',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_refresh (refresh_token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- LOGIN HISTORY
-- =======================
CREATE TABLE IF NOT EXISTS login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL DEFAULT NULL,
  device_name VARCHAR(100) DEFAULT '',
  browser VARCHAR(100) DEFAULT '',
  ip_address VARCHAR(45) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_login (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- OTP CODES (Two-Factor Auth)
-- =======================
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_otp (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- AUDIT LOGS
-- =======================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  actor_label VARCHAR(255) DEFAULT '',
  action VARCHAR(100) NOT NULL,
  details TEXT,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id INT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user_audit (user_id),
  INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- PRODUCTS
-- =======================
CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity INT DEFAULT 0,
  min_stock_level INT DEFAULT 5,
  category VARCHAR(100) DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- CUSTOMERS
-- =======================
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) DEFAULT '',
  address TEXT,
  company VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- ORDERS
-- =======================
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL,
  user_id INT NULL,
  status ENUM('placed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled') DEFAULT 'placed',
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  facility_type VARCHAR(100) DEFAULT NULL,
  facility_size VARCHAR(50) DEFAULT NULL,
  notes TEXT,
  -- Step 4: Reorder Reminders — last time this order's customer was sent
  -- a reorder-reminder email (see services/reminderService.js). NULL means
  -- "never reminded yet".
  last_reminded_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- ORDER ITEMS
-- =======================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- INVENTORY
-- =======================
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_change INT NOT NULL,
  reason VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- NOTIFICATIONS
-- =======================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- SETTINGS
-- =======================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) DEFAULT 'Cleaning Kit Builder',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  address TEXT,
  dark_mode BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  login_notification_emails BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- SEED DATA
-- =======================
-- Admin: password = admin123
INSERT INTO users (name, email, password, role, email_verified, is_active)
VALUES ('Admin User', 'admin@example.com', '$2a$10$6yBsAXMgts6f4fq0zRtqEOI8eK9hEHSIFjtbSmjx3O2DDLgpQlsxy', 'admin', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Manager: password = manager123
INSERT INTO users (name, email, password, role, email_verified, is_active)
VALUES ('Manager User', 'manager@example.com', '$2a$10$6yBsAXMgts6f4fq0zRtqEOUQeLWXlF74JxkBOhqvUx51UFYWIbNJm', 'manager', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Staff: password = staff123
INSERT INTO users (name, email, password, role, email_verified, is_active)
VALUES ('Staff User', 'staff@example.com', '$2a$10$6yBsAXMgts6f4fq0zRtqEOFcjGibfI7l5NAm2JFHuMF3JrhV0HPAy', 'staff', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Customer: password = customer123
INSERT INTO users (name, email, password, role, email_verified, is_active)
VALUES ('Customer User', 'customer@example.com', '$2a$10$6yBsAXMgts6f4fq0zRtqEOznVlFR1MMUBYaIenwSler2SXfCRj38S', 'customer', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Sri Surya: password = 1234567890
INSERT INTO users (name, email, password, role, email_verified, is_active)
VALUES ('Sri Surya', 'srisurya1389@gmail.com', '$2a$10$BFAAAtS2E1Mqo5dNKgBIS.7el1DG3z5zmMpB3AUe1RzxJEiCAmMqa', 'admin', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Default Settings
INSERT INTO settings (company_name, email, phone, address, dark_mode, email_notifications, sms_notifications, login_notification_emails)
VALUES ('Cleaning Kit Builder', 'admin@example.com', '+1-555-0100', '123 Business Ave, Suite 100', FALSE, TRUE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE company_name=company_name;

-- =======================
-- QUOTATIONS
-- =======================
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255) DEFAULT '',
  facility_type VARCHAR(100) DEFAULT '',
  items JSON DEFAULT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('Draft','Sent','Accepted','Rejected','Converted') DEFAULT 'Draft',
  valid_until DATE DEFAULT NULL,
  notes TEXT,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- DELIVERIES
-- =======================
CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  address TEXT,
  delivery_date DATE DEFAULT NULL,
  status ENUM('Scheduled','In Transit','Delivered','Failed','Returned') DEFAULT 'Scheduled',
  driver_name VARCHAR(255) DEFAULT '',
  vehicle_number VARCHAR(100) DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- SALESMAN VISITS
-- =======================
CREATE TABLE IF NOT EXISTS salesman_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_id INT DEFAULT NULL,
  salesman_name VARCHAR(255) NOT NULL,
  visit_date DATE NOT NULL,
  purpose VARCHAR(255) DEFAULT '',
  outcome TEXT,
  follow_up_date DATE DEFAULT NULL,
  status ENUM('Scheduled','Completed','Cancelled','No Show') DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- REORDERS
-- =======================
CREATE TABLE IF NOT EXISTS reorders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT DEFAULT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  supplier VARCHAR(255) DEFAULT '',
  status ENUM('Pending','Approved','Ordered','Received','Cancelled') DEFAULT 'Pending',
  source VARCHAR(100) DEFAULT 'manual',
  notes TEXT,
  requested_by INT DEFAULT NULL,
  approved_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- CONTRACTS (Contract Pricing)
-- =======================
CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  contract_name VARCHAR(255) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tier ENUM('Bronze','Silver','Gold','Platinum') DEFAULT 'Bronze',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('Active','Expired','Pending','Terminated') DEFAULT 'Active',
  terms TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- COMPLIANCE RECORDS
-- =======================
CREATE TABLE IF NOT EXISTS compliance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_id INT DEFAULT NULL,
  compliance_type VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('Open','In Progress','Resolved','Overdue') DEFAULT 'Open',
  severity ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  target_date DATE DEFAULT NULL,
  findings TEXT,
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- WAREHOUSES
-- =======================
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) DEFAULT '',
  manager_name VARCHAR(255) DEFAULT '',
  capacity INT DEFAULT 0,
  status ENUM('Active','Inactive','Maintenance') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- WAREHOUSE STOCK
-- =======================
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  product_name VARCHAR(255) NOT NULL,
  zone VARCHAR(100) DEFAULT '',
  bin_location VARCHAR(100) DEFAULT '',
  quantity INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- B2B ACCOUNTS (Credit Accounts)
-- =======================
CREATE TABLE IF NOT EXISTS b2b_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  payment_terms VARCHAR(100) DEFAULT 'Net 30',
  account_status ENUM('Active','Suspended','Closed') DEFAULT 'Active',
  last_payment_date DATE DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- SAVED KITS
-- =======================
CREATE TABLE IF NOT EXISTS saved_kits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kit_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) DEFAULT '',
  facility_type VARCHAR(100) DEFAULT '',
  items JSON NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0,
  share_token VARCHAR(100) UNIQUE DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================
-- SEED: Sample Products
-- =======================
INSERT INTO products (name, description, price, stock_quantity, min_stock_level, category, is_active)
VALUES
  ('Disinfectant Spray 500ml', 'Multi-surface disinfectant spray kills 99.9% germs', 250.00, 100, 10, 'Disinfectants', TRUE),
  ('Floor Cleaner 1L', 'Concentrated floor cleaner for all floor types', 180.00, 80, 10, 'Floor Care', TRUE),
  ('Glass Cleaner 750ml', 'Streak-free glass and window cleaner', 150.00, 60, 8, 'Surface Care', TRUE),
  ('Hand Sanitizer 500ml', 'Instant hand sanitizer 70% alcohol', 200.00, 120, 15, 'Hygiene', TRUE),
  ('Toilet Bowl Cleaner 1L', 'Powerful toilet bowl cleaner and deodorizer', 120.00, 50, 5, 'Toilet Care', TRUE),
  ('All-Purpose Cleaner 1L', 'Versatile cleaner for kitchens and bathrooms', 160.00, 90, 10, 'Surface Care', TRUE),
  ('Microfiber Cloth Set (5pcs)', 'Ultra-soft microfiber cleaning cloths', 350.00, 40, 5, 'Cleaning Tools', TRUE),
  ('Mop with Bucket', 'Spin mop system with wringer bucket', 850.00, 20, 3, 'Cleaning Tools', TRUE)
ON DUPLICATE KEY UPDATE name=name;
