const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const net = require('net');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { connectMongo } = require('./config/mongodb');
const reminderService = require('./services/reminderService');

// =======================
// RBAC Seeder — seeds Manager & Staff users after MongoDB connects
// =======================
const seedRbacUsers = require('./scripts/seedRbacOnStartup');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const aiRoutes = require('./routes/aiRoutes');

// RBAC auth routes
const rbacAuthRoutes = require('./routes/rbacAuthRoutes');
const rbacAdminRoutes = require('./routes/rbacAdminRoutes');

// New B2B portal + role-aware dashboard routes
const bulkOrderRoutes = require('./routes/bulkOrderRoutes');
const contractPricingRoutes = require('./routes/contractPricingRoutes');
const facilityBundleRoutes = require('./routes/facilityBundleRoutes');
const rbacDashboardRoutes = require('./routes/rbacDashboardRoutes');
const b2bRoutes = require('./routes/b2bRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Helper to check if a port is available
const checkPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
};

// Helper to find the next available port starting from startPort
const getAvailablePort = async (startPort) => {
  let port = parseInt(startPort, 10);
  const maxPort = port + 10; // Check up to 10 fallback ports
  while (port < maxPort) {
    if (await checkPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error(`No available ports found in the range ${startPort} to ${maxPort - 1}`);
};

// =======================
// CORS
// =======================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL,
  // Vercel deployment URLs
  'https://cleaning-kit-package-builder-15zx.vercel.app',
  'https://cleaning-kit-package-builder.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    const validOrigins = allowedOrigins.filter(Boolean);
    if (
      !origin ||
      validOrigins.includes(origin) ||
      validOrigins.some(o => origin.startsWith(o)) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    }
  },
  credentials: true,
}));

// =======================
// Body parsing
// =======================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =======================
// Session + Passport (required for Google OAuth redirect flow)
// =======================
app.use(session({
  secret: process.env.SESSION_SECRET || 'cleaning_kit_builder_session_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// =======================
// Static files
// =======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// Request Logger (development)
// =======================
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  }
  next();
});

// =======================
// API Routes
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/auth', rbacAuthRoutes);
app.use('/api/admin', rbacAdminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// New B2B portals (Step 1) + bundling preview (Step 3) + role-aware
// dashboard/audit history (Step 5). All gated by middleware/rbacAuth.js.
app.use('/api/bulk-order', bulkOrderRoutes);
app.use('/api/contract-pricing', contractPricingRoutes);
app.use('/api/facility-bundle', facilityBundleRoutes);
app.use('/api/rbac-dashboard', rbacDashboardRoutes);
app.use('/api/b2b', b2bRoutes);

// =======================
// Health Check
// =======================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// =======================
// 404 Handler
// =======================
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// =======================
// Global Error Handler
// =======================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
});

// =======================
// Start Server
// =======================
const startServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('\n⚠️  WARNING: MySQL connection failed. Run schema.sql to set up tables.\n');
  }

  const mongoConnected = await connectMongo();
  if (!mongoConnected) {
    console.warn('\n⚠️  WARNING: MongoDB connection failed. RBAC login will not work.\n');
  } else {
    // Seed RBAC users (Manager & Staff) on every startup — critical for
    // in-memory MongoDB which loses data on restart.
    try {
      await seedRbacUsers();
    } catch (seedErr) {
      console.warn('⚠️  RBAC seed warning:', seedErr.message);
    }
  }

  let activePort = PORT;
  const isDefaultPortAvailable = await checkPortAvailable(PORT);
  if (!isDefaultPortAvailable) {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use.`);
    console.error(`If you want to free up port ${PORT}, run the following commands:`);
    if (process.platform === 'win32') {
      console.error(`  1. Find the PID: netstat -ano | findstr :${PORT}`);
      console.error(`  2. Terminate the process: taskkill /F /PID <PID>`);
    } else {
      console.error(`  1. Find the PID: lsof -i :${PORT}`);
      console.error(`  2. Terminate the process: kill -9 <PID>`);
    }

    try {
      activePort = await getAvailablePort(parseInt(PORT, 10) + 1);
      console.log(`\n🔄 Gracefully shifting to fallback port: ${activePort}\n`);
    } catch (err) {
      console.error(`❌ Graceful fallback failed: ${err.message}`);
      process.exit(1);
    }
  }

  const server = app.listen(activePort, () => {
    console.log(`\n🧹 Cleaning Kit Backend Server`);
    console.log(`================================`);
    console.log(`Server running on: http://localhost:${activePort}`);
    console.log(`API base URL:      http://localhost:${activePort}/api`);
    console.log(`Frontend origin:   http://localhost:5174`);
    console.log(`Environment:       ${process.env.NODE_ENV || 'development'}`);
    console.log(`MySQL database:    ${dbConnected ? '✅ Connected' : '❌ Not connected'}`);
    console.log(`MongoDB (RBAC):    ${mongoConnected ? '✅ Connected' : '❌ Not connected'}`);
    console.log(`================================\n`);

    // Step 4: Reorder Reminders — daily cron job (see services/reminderService.js)
    reminderService.start();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Server listener error: Port ${activePort} is already in use.`);
      process.exit(1);
    } else {
      console.error('❌ Server startup error:', err);
      process.exit(1);
    }
  });
};

startServer();
