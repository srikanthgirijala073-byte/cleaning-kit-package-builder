const path = require('path');
const backendDir = 'c:/Users/SRIKANTH/Downloads/cleankit_FIXED/cleankit_fixed/backend';

// Load dotenv from backend node_modules
const dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const db = require(path.join(backendDir, 'config/db'));

const queries = [
  `CREATE TABLE IF NOT EXISTS quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT DEFAULT NULL,
    customer_name VARCHAR(255) NOT NULL,
    package_name VARCHAR(255) DEFAULT '',
    facility_type VARCHAR(100) DEFAULT '',
    items JSON,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('Draft','Sent','Accepted','Rejected','Converted') DEFAULT 'Draft',
    valid_until DATE DEFAULT NULL,
    notes TEXT,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS deliveries (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS salesman_visits (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS reorders (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS contracts (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS compliance_records (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT '',
    manager_name VARCHAR(255) DEFAULT '',
    capacity INT DEFAULT 0,
    status ENUM('Active','Inactive','Maintenance') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS warehouse_stock (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS b2b_accounts (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

async function run() {
  console.log("Initializing B2B Tables in MySQL...");
  for (const query of queries) {
    try {
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      await db.execute(query);
      console.log(`- Table '${tableName}' checked/created successfully.`);
    } catch (e) {
      console.error(`- Error executing query for:`, e.message);
    }
  }
  console.log("Done!");
  process.exit(0);
}

run();
