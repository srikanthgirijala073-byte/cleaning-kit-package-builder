# Admin / Manager / Staff RBAC System — What Was Added

This adds a **separate, MongoDB-backed** role-based auth system for Admin,
Manager, and Staff, alongside your existing MySQL customer auth (which was
left untouched).

## 1. Setup

**Backend**
```
cd backend
npm install        # installs mongoose (already added to package.json)
```
Add to `backend/.env` (already added with sensible defaults):
```
MONGODB_URI=mongodb://127.0.0.1:27017/cleaning_kit_rbac
ADMIN_EMAIL=srikanthgirijala073@gmail.com
ADMIN_PASSWORD=741852
RBAC_JWT_EXPIRES_IN=1d
```
Run a local MongoDB instance (or point `MONGODB_URI` at MongoDB Atlas), then:
```
npm run dev
```
The server logs will show `MongoDB (RBAC): ✅ Connected` once it's reachable.
The rest of the app keeps working even if Mongo is down — only Manager/Staff
login and management will fail until it's connected.

**Frontend**
```
cd frontend
npm install         # installs react-hot-toast (already added to package.json)
npm run dev
```

## 2. How to use it

- Visit `/portal` for the role-selection screen (Admin / Manager / Staff / Customer).
- **Admin**: `/admin/login` → fixed credentials (`srikanthgirijala073@gmail.com` / `741852`) → `/admin/dashboard`.
- From the Admin dashboard you can **create Manager and Staff accounts** (this calls the new admin-management API and hashes the password with bcrypt before storing it in MongoDB).
- **Manager**: `/manager/login` → `/manager/dashboard`. Only works for accounts created by Admin with `status: "active"`.
- **Staff**: `/staff/login` → `/staff/dashboard`. Same as Manager, plus a `department` field.
- A "Go to the Ops Access Portal" link was added to the bottom of your existing `/login` page so it's discoverable; nothing else on that page was changed.

## 3. New backend files
- `config/mongodb.js` — Mongoose connection (separate from MySQL `config/db.js`)
- `models/Manager.js`, `models/Staff.js` — schemas with bcrypt password hashing
- `utils/rbacToken.js` — JWT sign/verify, payload `{ userId, email, role }`, 1-day expiry
- `middleware/rbacAuth.js` — `protect` (verifies token) and `authorize(...roles)`
- `controllers/rbacAuthController.js` — `adminLogin`, `managerLogin`, `staffLogin`, `getMe`
- `controllers/rbacAdminController.js` — admin-only create/list/activate/deactivate/delete for Managers & Staff
- `routes/rbacAuthRoutes.js` — mounted at `/api/auth` → adds `/admin/login`, `/manager/login`, `/staff/login`, `/rbac/me`
- `routes/rbacAdminRoutes.js` — mounted at `/api/admin` (all routes require `admin` role)

## 4. New frontend files
- `context/RbacAuthContext.jsx` — React Context holding the admin/manager/staff session, restores it from `localStorage` (`token`, `role`) on refresh and re-validates it against `/api/auth/rbac/me`
- `services/rbacApi.js` — axios client for all the endpoints above
- `components/RbacProtectedRoute.jsx` — guards `/admin/*`, `/manager/*`, `/staff/*`; redirects unauthenticated/wrong-role users to `/login` with a toast: "You are not authorized to access this page."
- `components/rbac/RoleLoginForm.jsx`, `DashboardShell.jsx` — shared UI building blocks
- `pages/rbac/RoleSelect.jsx`, `AdminLogin.jsx`, `ManagerLogin.jsx`, `StaffLogin.jsx`, `AdminDashboard.jsx`, `ManagerDashboard.jsx`, `StaffDashboard.jsx`
- `styles/rbac.css` — dark "ops console" theme (violet=Admin, teal=Manager, amber=Staff)

## 5. Notes / things you may want next
- **Forgot password** links for Manager/Staff currently just show an informational toast ("contact your administrator") since password resets weren't specified — let me know if you want a real reset flow.
- **Manager/Staff dashboards** are intentionally minimal placeholders (welcome message + role banner) since only the *auth system* was in scope — happy to build out real dashboard features (orders, inventory, etc.) next.
- The **Customer** card on `/portal` currently links to your existing `/` route, which still requires the existing customer login/registration flow exactly as it did before. If you'd like customers to browse fully without logging in (as the original spec described), that would mean changing your existing `ProtectedRoute`/`Dashboard` behavior — let me know and I can do that as a separate, scoped change.
