# Cleaning Kit Package Builder — Setup Guide

## Quick Start (already works)
```bash
# Terminal 1 — Backend
cd backend
npm install
node server.js

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open: http://localhost:5174

---

## Fixes Applied in This Version

### ✅ Fixed: aiService.js syntax error
Rewrote from legacy `var` style to clean ES module syntax.
Dashboard, Kit Builder, Manager Dashboard now load without crashes.

### ✅ Fixed: Home.jsx hardcoded stats
Now fetches real data from `/api/dashboard/stats`.
Shows actual DB totals instead of "1,250 / 850 / 500 / ₹5,20,000".

### ✅ Fixed: PDF Export on Reports page
Click Generate → then click the red PDF button (🗒️) next to the CSV button.
Uses jsPDF + jspdf-autotable (installed via npm install).

### ✅ Fixed: FRONTEND_URL updated to :5174
backend/.env now points to http://localhost:5174 (the correct dev port).

---

## Manual Steps Required

### 1. MongoDB (RBAC — fix data reset on restart)
Without MongoDB installed locally, Manager/Staff accounts reset on every backend restart.

Option A — Install MongoDB locally (recommended for dev):
- Download: https://www.mongodb.com/try/download/community
- Install and start the service
- backend/.env MONGODB_URI is already set to mongodb://127.0.0.1:27017/cleaning_kit_rbac

Option B — MongoDB Atlas (for cloud/deployment):
- Go to https://cloud.mongodb.com → free M0 cluster
- Copy connection string → paste into backend/.env MONGODB_URI

RBAC default accounts (seeded automatically):
- Manager: kt493342@gmail.com
- Staff: jahnavisadhu26@gmail.com
- Login at: http://localhost:5174/portal

### 2. Gmail SMTP (real emails)
Currently emails are logged to console only (mock mode).
To send real emails:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification → App passwords
3. Generate an App Password for "Mail"
4. Fill in backend/.env:
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_16_char_app_password

### 3. Google Sign-In (OAuth)
1. Go to https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URI: http://localhost:5000/api/auth/google/callback
5. Copy Client ID + Secret → paste into backend/.env
6. Go to https://console.firebase.google.com/
7. Create project → Web app → copy 6 config values → paste into frontend/.env VITE_FIREBASE_* keys
8. In Firebase: Authentication → Sign-in method → Enable Google
9. In Firebase: Authentication → Settings → Authorized Domains → add localhost

---

## Login Credentials (local dev)

### Main App (MySQL auth)
Register at: http://localhost:5174/register
Or use admin created via SQL:
```sql
-- Run this in MySQL if you need an admin account:
INSERT INTO users (name, email, password, role, email_verified)
VALUES ('Admin', 'admin@cleankit.com', '$2b$10$...', 'admin', true);
```

### RBAC Portal (MongoDB auth)
URL: http://localhost:5174/portal
- Admin: No default — create via /admin/login after seeding
- Manager: kt493342@gmail.com (seeded on first start)
- Staff: jahnavisadhu26@gmail.com (seeded on first start)
