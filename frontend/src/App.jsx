import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "./services/api";

// Layout Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { useAuth } from "./context/AuthContext";

// Pages
import Dashboard from "./pages/Dashboard";
import KitBuilder from "./pages/KitBuilder";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import DetailPage from "./pages/DetailPage";

// Authentication Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import SecuritySettings from "./pages/SecuritySettings";
import LoginHistory from "./pages/LoginHistory";
import GoogleLoginSimulator from "./pages/GoogleLoginSimulator";

// Error Pages
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// RBAC (Admin / Manager / Staff) Ops Portal — separate auth system, MongoDB-backed
import RbacProtectedRoute from "./components/RbacProtectedRoute";
import RoleSelect from "./pages/rbac/RoleSelect";
import AdminLogin from "./pages/rbac/AdminLogin";
import ManagerLogin from "./pages/rbac/ManagerLogin";
import StaffLogin from "./pages/rbac/StaffLogin";
import AdminDashboard from "./pages/rbac/AdminDashboard";
import ManagerDashboard from "./pages/rbac/ManagerDashboard";
import StaffDashboard from "./pages/rbac/StaffDashboard";

// B2B Portal Pages
import QuotationBuilder from "./pages/b2b/QuotationBuilder";
import DeliveryTracker from "./pages/b2b/DeliveryTracker";
import SalesmanVisitForm from "./pages/b2b/SalesmanVisitForm";
import ReorderDashboard from "./pages/b2b/ReorderDashboard";
import ContractPricing from "./pages/b2b/ContractPricing";
import CompliancePortal from "./pages/b2b/CompliancePortal";
import ProductCatalog from "./pages/b2b/ProductCatalog";
import BulkOrderPortal from "./pages/b2b/BulkOrderPortal";
import WarehouseManagement from "./pages/b2b/WarehouseManagement";

// Role Dashboards
import SalesmanDashboard from "./pages/role/SalesmanDashboard";
import DeliveryDashboard from "./pages/role/DeliveryDashboard";
import AccountsDashboard from "./pages/role/AccountsDashboard";
import ComplianceDashboard from "./pages/role/ComplianceDashboard";
import DealerLogin from "./pages/role/DealerLogin";
import DealerDashboard from "./pages/role/DealerDashboard";

function App() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // App-level check for OAuth redirect popup window to message opener and close
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const historyId = searchParams.get("historyId");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "OAUTH_FAILURE",
            error: errorParam
          },
          "*"
        );
      }
      window.close();
      return;
    }

    if (token && refreshToken) {
      // Fetch user profile info over API before writing to localStorage
      axios
        .get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          const sessionData = {
            accessToken: token,
            token,
            refreshToken,
            historyId,
            user: response.data
          };

          // Save final, complete session details to localStorage
          localStorage.setItem("user", JSON.stringify(sessionData));

          // Post message back if opener exists
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "OAUTH_SUCCESS",
                token,
                refreshToken,
                historyId,
                user: response.data
              },
              "*"
            );
          }
          
          // Close the popup window
          window.close();
        })
        .catch((err) => {
          console.error("Failed to load user profile details in popup:", err);
          // Clean up and close on error
          localStorage.removeItem("user");
          window.close();
        });
    }
  }, []);

  // Listen for storage changes from the popup window (fallback when window.opener is lost)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "user" && event.newValue) {
        try {
          const sessionData = JSON.parse(event.newValue);
          if (sessionData.token || sessionData.accessToken) {
            // Redirect parent window to dashboard
            window.location.href = "/dashboard";
          }
        } catch (error) {
          console.error("Failed to parse storage event user data:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // If this is an OAuth popup select, render it directly without App Shell wrapper
  if (location.pathname.startsWith("/auth/")) {
    return (
      <Routes>
        <Route path="/auth/:provider/select" element={<GoogleLoginSimulator />} />
      </Routes>
    );
  }

  // Admin / Manager / Staff Ops Portal — a separate, MongoDB-backed RBAC
  // system with its own dark-themed login pages and dashboards. Rendered
  // standalone (no Navbar/Sidebar) since it's an internal access portal.
  if (location.pathname.startsWith("/dealer")) {
    return (
      <Routes>
        <Route path="/dealer/login" element={<DealerLogin />} />
        <Route path="/dealer/dashboard" element={<ProtectedRoute><DealerDashboard /></ProtectedRoute>} />
      </Routes>
    );
  }

  if (
    location.pathname === "/portal" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/manager") ||
    location.pathname.startsWith("/staff")
  ) {
    return (
      <Routes>
        <Route path="/portal" element={<RoleSelect />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <RbacProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </RbacProtectedRoute>
          }
        />

        <Route path="/manager/login" element={<ManagerLogin />} />
        <Route
          path="/manager/dashboard"
          element={
            <RbacProtectedRoute requiredRole="manager">
              <ManagerDashboard />
            </RbacProtectedRoute>
          }
        />

        <Route path="/staff/login" element={<StaffLogin />} />
        <Route
          path="/staff/dashboard"
          element={
            <RbacProtectedRoute requiredRole="staff">
              <StaffDashboard />
            </RbacProtectedRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={`main-wrapper ${!isAuthenticated ? "no-sidebar" : ""}`}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="main-content">

          <Routes>

            {/* Public Routes redirected to Dashboard */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kit-builder"
              element={
                <RoleProtectedRoute requiredRoles={["customer", "staff", "manager", "admin"]}>
                  <KitBuilder />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <RoleProtectedRoute requiredRoles={["staff", "manager", "admin"]}>
                  <Products />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <Inventory />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <RoleProtectedRoute requiredRoles={["staff", "manager", "admin"]}>
                  <Orders />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <Customers />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <Reports />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <Analytics />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <History />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <RoleProtectedRoute requiredRoles={["admin"]}>
                  <Settings />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/security-settings"
              element={
                <ProtectedRoute>
                  <SecuritySettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/login-history"
              element={
                <ProtectedRoute>
                  <LoginHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/details/:id"
              element={
                <ProtectedRoute>
                  <DetailPage />
                </ProtectedRoute>
              }
            />

            {/* B2B Portal Routes */}
            <Route
              path="/b2b/quotations"
              element={
                <RoleProtectedRoute requiredRoles={["staff", "manager", "admin"]}>
                  <QuotationBuilder />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/b2b/delivery-tracker"
              element={
                <RoleProtectedRoute requiredRoles={["staff", "manager", "admin"]}>
                  <DeliveryTracker />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/b2b/visits"
              element={
                <RoleProtectedRoute requiredRoles={["staff", "manager", "admin"]}>
                  <SalesmanVisitForm />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/b2b/reorders"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <ReorderDashboard />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/b2b/contracts"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <ContractPricing />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/b2b/compliance"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin", "compliance"]}>
                  <CompliancePortal />
                </RoleProtectedRoute>
              }
            />

            {/* B2B — 3 Missing Portals */}
            <Route
              path="/b2b/catalog"
              element={
                <ProtectedRoute>
                  <ProductCatalog />
                </ProtectedRoute>
              }
            />

            <Route
              path="/b2b/bulk-orders"
              element={
                <RoleProtectedRoute requiredRoles={["staff", "manager", "admin", "dealer"]}>
                  <BulkOrderPortal />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/b2b/warehouse"
              element={
                <RoleProtectedRoute requiredRoles={["manager", "admin"]}>
                  <WarehouseManagement />
                </RoleProtectedRoute>
              }
            />

            {/* Role Dashboards */}
            <Route
              path="/salesman/dashboard"
              element={
                <RoleProtectedRoute requiredRoles={["salesman", "manager", "admin"]}>
                  <SalesmanDashboard />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/delivery/dashboard"
              element={
                <RoleProtectedRoute requiredRoles={["delivery", "manager", "admin"]}>
                  <DeliveryDashboard />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/accounts/dashboard"
              element={
                <RoleProtectedRoute requiredRoles={["accounts", "manager", "admin"]}>
                  <AccountsDashboard />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/compliance-admin/dashboard"
              element={
                <RoleProtectedRoute requiredRoles={["compliance", "manager", "admin"]}>
                  <ComplianceDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />

          </Routes>

        </div>

        <Footer />
      </div>
    </div>
  );
}

export default App;