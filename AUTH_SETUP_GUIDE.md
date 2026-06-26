# 🔐 Authentication System — Complete Setup & Implementation Guide

This guide covers every step to get the full authentication system running:
**Register → Verify Email → Login → Dashboard**, with Google OAuth, RBAC roles, and all email notifications.

---

## ✅ What's Already Implemented

| Feature | Status | Location |
|---|---|---|
| Register with email/password | ✅ Done | `POST /api/auth/register` |
| Email verification | ✅ Done | `GET /api/auth/verify-email/:token` |
| Login with JWT | ✅ Done | `POST /api/auth/login` |
| Logout | ✅ Done | `POST /api/auth/logout` |
| Forgot password | ✅ Done | `POST /api/auth/forgot-password` |
| Reset password | ✅ Done | `POST /api/auth/reset-password` |
| Google OAuth (real) | ✅ Done | `GET /api/auth/google` |
| Google Sign-In (Firebase popup) | ✅ Done | `AuthContext.loginWithFirebaseGoogle` |
| Role-based access (Admin/Manager/Staff/Customer) | ✅ Done | `middleware/authMiddleware.js` |
| Login history tracking | ✅ Done | `GET /api/auth/login-history` |
| Account lock after 5 failed attempts | ✅ Done | `User.incrementFailedAttempts` |
| 2FA OTP via email | ✅ Done | `POST /api/auth/send-otp` |
| Welcome email | ✅ Done | `emailService.sendWelcome` |
| Verification email | ✅ Done | `emailService.sendVerification` |
| Login alert email | ✅ Done | `emailService.sendLoginNotification` |
| Reset password email | ✅ Done | `emailService.sendPasswordReset` |
| Account locked email | ✅ Done | `emailService.sendAccountLocked` |
| Order confirmation email | ✅ Done | `emailService.sendOrderConfirmation` |
| Order status email | ✅ Done | `emailService.sendOrderStatusUpdate` |
| Low stock alert email (admin) | ✅ Done | `emailService.sendLowStockAlert` |
| RBAC Admin/Manager/Staff portal | ✅ Done | MongoDB-backed `/portal` |

---

## 📋 Step 1 — Install MySQL and Create the Database

### Option A: MySQL already installed
```bash
mysql -u root -p < backend/schema.sql
```

### Option B: Install MySQL (Windows)
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Install MySQL Server 8.0 (note the root password you set)
3. Open MySQL Workbench or Command Prompt
4. Run: `mysql -u root -p < path/to/backend/schema.sql`

### Option C: Install MySQL (macOS)
```bash
brew install mysql
brew services start mysql
mysql -u root < backend/schema.sql
```

### Option D: Install MySQL (Ubuntu/Linux)
```bash
sudo apt install mysql-server
sudo mysql < backend/schema.sql
```

This creates `cleaning_kit_db` with all tables and 4 seed users:
| Email | Password | Role |
|---|---|---|
| admin@example.com | admin123 | admin |
| manager@example.com | manager123 | manager |
| staff@example.com | staff123 | staff |
| customer@example.com | customer123 | customer |

---

## 📋 Step 2 — Install MongoDB (for RBAC portal)

### Windows
Download from https://www.mongodb.com/try/download/community and install.
MongoDB runs on port 27017 automatically.

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Ubuntu/Linux
```bash
sudo apt install mongodb
sudo systemctl start mongodb
```

### Verify MongoDB
```bash
mongosh
> show dbs
```

---

## 📋 Step 3 — Configure Backend `.env`

Edit `backend/.env` with your actual values:

```env
# ---- MySQL ----
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourMySQLPassword   # ← CHANGE THIS
DB_NAME=cleaning_kit_db

# ---- MongoDB (RBAC) ----
MONGODB_URI=mongodb://127.0.0.1:27017/cleaning_kit_rbac

# ---- RBAC Admin Credentials ----
ADMIN_EMAIL=your@email.com       # ← CHANGE THIS
ADMIN_PASSWORD=yourpassword      # ← CHANGE THIS

# ---- JWT ----
JWT_SECRET=cleaning_kit_builder_jwt_secret_key_2026

# ---- Frontend URL ----
FRONTEND_URL=http://localhost:5173
```

---

## 📋 Step 4 — Enable Email Notifications

The system works without email configured (uses Ethereal test mail for previewing).
For real emails, do the following:

### Setup Gmail SMTP
1. Log in to your Gmail → Click profile icon → **Manage your Google Account**
2. Go to **Security** tab
3. Enable **2-Step Verification** (required for App Passwords)
4. Then go to **Security → App Passwords**
5. Select app: **Mail**, Device: **Other** → name it "Cleaning Kit"
6. Copy the **16-character password** generated

Edit `backend/.env`, uncomment and fill in:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=abcdabcdabcdabcd    # 16-char App Password (no spaces)
EMAIL_FROM=Cleaning Kit Builder <yourgmail@gmail.com>
```

### Test Without Gmail
Without configuring email, the server automatically creates a free **Ethereal** test account.
Check the terminal/console — it prints a preview URL like:
```
📧 Email preview: https://ethereal.email/message/abc123
```
Open that URL to see the email content in the browser.

---

## 📋 Step 5 — Enable Google Sign-In (Firebase)

### Option A: Firebase Google Sign-In (Popup — Recommended)
1. Go to https://console.firebase.google.com
2. Create a project → **Add app** → Web
3. Enable **Authentication** → **Sign-in providers** → Enable **Google**
4. Copy the Firebase config object

Edit `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Add `http://localhost:5173` to Firebase **Authorized domains**.

### Option B: Google OAuth 2.0 (Redirect Flow)
1. Go to https://console.cloud.google.com
2. Create credentials → **OAuth 2.0 Client ID** → Web application
3. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
4. Copy Client ID and Secret

Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
```

**Without either configured**, the login page shows a Google account selector simulator so you can still test the full flow.

---

## 📋 Step 6 — Install Dependencies and Start

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

You should see:
```
🧹 Cleaning Kit Backend Server
================================
Server running on: http://localhost:5000
MySQL database:    ✅ Connected
MongoDB (RBAC):    ✅ Connected
================================
```

Open http://localhost:5173 in your browser.

---

## 📋 Step 7 — Test the Complete Authentication Flow

### 7a. Register a New User
1. Go to http://localhost:5173/register
2. Fill in name, email, password
3. Click **Register**
4. Check terminal for Ethereal email preview link (or your inbox if Gmail configured)
5. Click the verification link in the email

### 7b. Login
1. Go to http://localhost:5173/login
2. Enter email and password
3. You're redirected to the dashboard

### 7c. Forgot Password
1. Go to http://localhost:5173/forgot-password
2. Enter email → click **Send Reset Link**
3. Check email for reset link
4. Click the link → enter new password → click **Save Password**
5. Login with the new password

### 7d. Google Sign-In
1. Go to http://localhost:5173/login
2. Click **Continue with Google**
3. Select your Google account (or use simulator if not configured)
4. You're redirected to the dashboard

### 7e. RBAC Portal (Admin/Manager/Staff)
1. Go to http://localhost:5173/portal
2. Click **Admin** → enter credentials from `.env` (ADMIN_EMAIL / ADMIN_PASSWORD)
3. From Admin Dashboard, create Manager and Staff accounts
4. Log in as Manager or Staff at `/portal`

---

## 🗂️ Database Tables Reference

| Table | Purpose |
|---|---|
| `users` | Core user accounts (all roles) |
| `email_verification_tokens` | Email verification links |
| `password_reset_tokens` | Password reset links |
| `user_sessions` | JWT refresh tokens per device |
| `login_history` | Login audit trail (device, IP, location) |
| `otp_codes` | 2FA OTP codes |
| `audit_logs` | Security event log |

---

## 🛣️ API Routes Reference

### Authentication
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout and revoke refresh token |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/google` | Google OAuth redirect |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Email & Password
| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/verify-email/:token` | Verify email address |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Set new password |

### Profile & Security
| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/auth/login-history` | View login history |
| GET | `/api/auth/audit-logs` | View security logs |
| GET | `/api/auth/sessions` | View active sessions |

### RBAC Portal
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/manager/login` | Manager login |
| POST | `/api/auth/staff/login` | Staff login |
| GET | `/api/auth/rbac/me` | Get RBAC user info |

---

## ⚙️ Role Permissions

| Feature | Admin | Manager | Staff | Customer |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ | 👁️ view only |
| Orders | ✅ | ✅ | ✅ | own only |
| Inventory | ✅ | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ |
| Customers | ✅ | ✅ | ❌ | ❌ |
| Kit Builder | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |

---

## 🐛 Troubleshooting

### "Database connection failed"
- Make sure MySQL is running: `sudo systemctl start mysql` or start MySQL Workbench
- Check `DB_PASSWORD` in `backend/.env` matches your MySQL root password
- Try: `mysql -u root -p` to confirm your credentials work

### "MongoDB connection failed"
- Start MongoDB: `sudo systemctl start mongodb` or `brew services start mongodb-community`
- RBAC (Admin/Manager/Staff login) won't work without MongoDB
- Customer login still works — it uses MySQL only

### "Email not received"
- Check the backend terminal for Ethereal preview URLs (📧 lines)
- If using Gmail: make sure you used an **App Password** (not your Gmail login password)
- Gmail App Passwords require 2-Step Verification to be enabled first

### "Google sign-in not working"
- Without Firebase or Google OAuth configured, you'll see the **account selector simulator** — that's normal
- To use real Google Sign-In: set up Firebase and add the VITE_FIREBASE_* keys to `frontend/.env`

### "Too many login attempts"
- Rate limiting is **disabled in development** (`NODE_ENV=development`)
- Account lockout (5 failed attempts) is still active in all environments
- Reset a locked account: `mysql -u root -p cleaning_kit_db -e "UPDATE users SET account_locked=0, failed_login_attempts=0 WHERE email='you@example.com'"`

---

## 📁 Key Files Changed/Fixed in This Update

| File | Change |
|---|---|
| `backend/server.js` | Added `express-session` + `passport.initialize()` for Google OAuth |
| `backend/package.json` | Added missing: `express-rate-limit`, `express-session`, `passport`, `passport-google-oauth20` |
| `backend/schema.sql` | Complete corrected schema with all tables and seed data |
| `backend/.env` | Added email SMTP config with instructions |
| `backend/utils/emailService.js` | 11 full HTML email templates with Ethereal fallback |
| `backend/middleware/rateLimiter.js` | Disabled rate limits in dev environment for easy testing |
| `frontend/.env` | Created with backend URL and Firebase placeholders |
| `frontend/src/services/api.js` | Added missing `forgotPassword`, `resetPassword`, `getLoginHistory` exports |

