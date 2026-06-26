const db = require('../config/db');

async function runSchemaUpdate() {
  console.log('Starting schema update...');
  try {
    // 1. Alter users table
    // We check if columns exist before adding to avoid MySQL error
    const columns = await db.query('SHOW COLUMNS FROM users');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('google_id')) {
      console.log('Adding google_id column...');
      await db.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL AFTER password');
    }
    if (!columnNames.includes('github_id')) {
      console.log('Adding github_id column...');
      await db.query('ALTER TABLE users ADD COLUMN github_id VARCHAR(255) UNIQUE DEFAULT NULL AFTER google_id');
    }
    if (!columnNames.includes('microsoft_id')) {
      console.log('Adding microsoft_id column...');
      await db.query('ALTER TABLE users ADD COLUMN microsoft_id VARCHAR(255) UNIQUE DEFAULT NULL AFTER github_id');
    }
    if (!columnNames.includes('address')) {
      console.log('Adding address column...');
      await db.query('ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL AFTER phone');
    }
    if (!columnNames.includes('email_verified')) {
      console.log('Adding email_verified column...');
      await db.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER role');
    }
    if (!columnNames.includes('two_factor_enabled')) {
      console.log('Adding two_factor_enabled column...');
      await db.query('ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE AFTER email_verified');
    }
    if (!columnNames.includes('failed_login_attempts')) {
      console.log('Adding failed_login_attempts column...');
      await db.query('ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 AFTER two_factor_enabled');
    }
    if (!columnNames.includes('account_locked')) {
      console.log('Adding account_locked column...');
      await db.query('ALTER TABLE users ADD COLUMN account_locked BOOLEAN DEFAULT FALSE AFTER failed_login_attempts');
    }
    if (!columnNames.includes('lock_until')) {
      console.log('Adding lock_until column...');
      await db.query('ALTER TABLE users ADD COLUMN lock_until TIMESTAMP NULL DEFAULT NULL AFTER account_locked');
    }
    if (!columnNames.includes('last_login')) {
      console.log('Adding last_login column...');
      await db.query('ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER lock_until');
    }

    // Adjust users password column to allow NULL for Google-only users
    await db.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');

    // 2. Create supporting tables
    console.log('Creating email_verification_tokens table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating password_reset_tokens table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating user_sessions table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        refresh_token VARCHAR(500) NOT NULL UNIQUE,
        device_name VARCHAR(100) DEFAULT '',
        browser VARCHAR(100) DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_refresh (refresh_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating login_history table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        device_name VARCHAR(100) DEFAULT '',
        browser VARCHAR(100) DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        location VARCHAR(255) DEFAULT '',
        logout_time TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_user_login (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating otp_codes table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_user_otp (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating audit_logs table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Step 5: Action History — extend audit_logs with actor_label (free
    // text identity for actors that don't have a MySQL users.user_id,
    // e.g. RBAC Admin/Manager/Staff accounts backed by MongoDB) and
    // entity_type/entity_id (which record was changed), so the audit
    // trail can answer "who changed THIS order and when".
    console.log('Checking audit_logs table columns...');
    const auditColumns = await db.query('SHOW COLUMNS FROM audit_logs');
    const auditColumnNames = auditColumns.map(c => c.Field);

    if (!auditColumnNames.includes('actor_label')) {
      console.log('Adding actor_label column to audit_logs...');
      await db.query("ALTER TABLE audit_logs ADD COLUMN actor_label VARCHAR(255) DEFAULT '' AFTER user_id");
    }
    if (!auditColumnNames.includes('entity_type')) {
      console.log('Adding entity_type column to audit_logs...');
      await db.query('ALTER TABLE audit_logs ADD COLUMN entity_type VARCHAR(50) DEFAULT NULL AFTER details');
    }
    if (!auditColumnNames.includes('entity_id')) {
      console.log('Adding entity_id column to audit_logs...');
      await db.query('ALTER TABLE audit_logs ADD COLUMN entity_id INT DEFAULT NULL AFTER entity_type');
      console.log('Adding index on (entity_type, entity_id)...');
      await db.query('ALTER TABLE audit_logs ADD INDEX idx_audit_entity (entity_type, entity_id)');
    }

    // 3. Update orders and order_history tables
    console.log('Checking orders table columns...');
    const orderColumns = await db.query('SHOW COLUMNS FROM orders');
    const orderColumnNames = orderColumns.map(c => c.Field);

    if (!orderColumnNames.includes('facility_type')) {
      console.log('Adding facility_type column...');
      await db.query('ALTER TABLE orders ADD COLUMN facility_type VARCHAR(100) DEFAULT NULL AFTER status');
    }
    if (!orderColumnNames.includes('facility_size')) {
      console.log('Adding facility_size column...');
      await db.query('ALTER TABLE orders ADD COLUMN facility_size VARCHAR(50) DEFAULT NULL AFTER facility_type');
    }
    if (!orderColumnNames.includes('notes')) {
      console.log('Adding notes column...');
      await db.query('ALTER TABLE orders ADD COLUMN notes TEXT DEFAULT NULL AFTER facility_size');
    }
    if (!orderColumnNames.includes('last_reminded_at')) {
      // Step 4: Reorder Reminders (services/reminderService.js) — tracks the
      // last time a customer was emailed a "time to reorder" nudge for this
      // order, so the cron job never double-sends within the cooldown window.
      console.log('Adding last_reminded_at column...');
      await db.query('ALTER TABLE orders ADD COLUMN last_reminded_at TIMESTAMP NULL DEFAULT NULL AFTER notes');
    }

    console.log('Creating order_history table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        INDEX idx_order_history_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Migrating existing orders status to order_history...');
    const existingOrders = await db.query('SELECT order_id, status, created_at FROM orders');
    for (const ord of existingOrders) {
      const historyCount = await db.query('SELECT COUNT(*) as count FROM order_history WHERE order_id = ?', [ord.order_id]);
      if (historyCount[0].count === 0) {
        await db.query('INSERT INTO order_history (order_id, status, notes, created_at) VALUES (?, ?, ?, ?)', [
          ord.order_id,
          ord.status,
          'Initial status recorded during system migration.',
          ord.created_at
        ]);
      }
    }

    console.log('Schema update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

runSchemaUpdate();
