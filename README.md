# 🧹 Cleaning Kit Package Builder
**Company:** Ganga Maxx Marketplace | **Internship Project — June 2026**

A B2B web platform for institutional customers (hotels, hospitals, schools, offices) to build, order, and manage custom cleaning product kits. Includes admin management, RBAC roles, B2B portals, and AI-powered recommendations.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- MongoDB 6+ (for RBAC)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env          # Fill in your DB credentials
mysql -u root -p < schema.sql # Run once to create all tables
node server.js
# Server starts at http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env with: VITE_BACKEND_URL=http://localhost:5000
npm run dev
# App starts at http://localhost:5173
```

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Staff | staff@example.com | staff123 |
| Customer | customer@example.com | customer123 |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + React Router 7 + Axios |
| Backend | Node.js + Express 4 |
| Primary DB | MySQL 8 (orders, products, customers, B2B data) |
| RBAC DB | MongoDB (admin/manager/staff auth) |
| Auth | JWT + Refresh Tokens + 2FA/OTP + Google OAuth |
| Testing | Playwright (E2E) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## ✨ Features

### Customer Side
- **Kit Builder** — Manual product selection + AI Smart Assistant (facility-wise bundles)
- **Save Kit** — Persist kit to database with a unique share link
- **Share Kit** — Copy shareable link to send to customers
- Product search, filter by category, quantity selection, price calculation
- Order placement → real-time DB save + order history timeline
- Order History — real orders from database with status filter

### Admin Side
- Dashboard — live stats (revenue, orders, customers, products)
- Analytics — real KPI data from database
- Product, Order, Customer CRUD management
- Inventory tracking with low-stock alerts
- Sales, Revenue, Inventory reports with CSV export
- Notifications

### B2B Portals (All connected to MySQL)
- 📄 Quotation Builder — create, edit, convert to order
- 🚚 Delivery Tracker — schedule and track deliveries
- 🚗 Salesman Visits — log and track customer visits
- 🔄 Reorder Dashboard — manage reorders with low-stock suggestions
- 📜 Contract Pricing — customer contracts with tier discounts
- 🛡️ Compliance Portal — track compliance records and audit findings
- 🏭 Warehouse Management — manage warehouses and stock by zone/bin
- 📦 Bulk Order Portal
- 💼 B2B Accounts (Credit Accounts)

### RBAC System (MongoDB)
- Separate Admin / Manager / Staff login portals
- Role-based route protection

---

## 📁 Project Structure

```
clean kit/
├── backend/
│   ├── config/          # DB, JWT, passport, facility map
│   ├── controllers/     # Auth, orders, products, customers, dashboard, AI, B2B
│   ├── middleware/      # Auth, RBAC, rate limiting, upload
│   ├── models/          # MySQL models + MongoDB models
│   ├── routes/          # All API routes including b2bRoutes.js
│   ├── services/        # bundlingService, reminderService
│   ├── utils/           # aiEngine, emailService, helpers
│   ├── schema.sql       # Full MySQL schema (23 tables)
│   ├── server.js        # Main Express entry point
│   └── .env.example     # Copy to .env and fill in credentials
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── context/     # AuthContext, CartContext, ThemeContext
    │   ├── pages/       # All pages including b2b/ and rbac/ portals
    │   ├── services/    # api.js (all API calls), aiService.js
    │   └── App.jsx      # Routes
    └── vercel.json      # SPA routing config for Vercel
```

---

## 🌐 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project on vercel.com
3. Set Root Directory: `frontend`
4. Add env var: `VITE_BACKEND_URL=https://your-backend.onrender.com`
5. Deploy

### Backend (Render)
1. Create Web Service on render.com
2. Root Directory: `backend`, Start Command: `node server.js`
3. Add all env variables from `.env.example`
4. Deploy

### Database
- MySQL: Use Railway.app (free tier) → copy connection string to .env
- MongoDB: Use MongoDB Atlas (free M0 tier) → copy connection string to .env

---

## 🗄️ Database Schema

**23 tables total:**
- Core: users, email_verification_tokens, password_reset_tokens, user_sessions, login_history, otp_codes, audit_logs
- Business: products, customers, orders, order_items, inventory, notifications, settings
- B2B: quotations, deliveries, salesman_visits, reorders, contracts, compliance_records, warehouses, warehouse_stock, b2b_accounts, saved_kits

---

## 🧪 Testing
```bash
cd frontend
npx playwright test
```
Playwright tests cover: auth, dashboard, kit-builder, orders, products, inventory, navigation.

---

## 📄 License
Internship project — Ganga Maxx Marketplace, June 2026.
