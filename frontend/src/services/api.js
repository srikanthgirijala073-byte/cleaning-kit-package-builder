import axios from "axios";

// Dynamically read backend URL from environment variables, fallback to Render production URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://cleaning-kit-package-builder.onrender.com";
export const API_BASE_URL = `${BACKEND_URL}/api`;

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach JWT token to all requests automatically
API.interceptors.request.use((config) => {
  // 1. Try customer-facing token (stored under "user" key)
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsed = JSON.parse(user);
      const token = parsed.accessToken || parsed.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch (e) { /* ignore parse errors */ }
  }

  // 2. Fallback: RBAC token (admin / manager / staff) stored under "token" key.
  //    This allows RBAC-authenticated dashboards (Manager, Staff) to call
  //    shared API endpoints (dashboard stats, recent orders, products, etc.).
  const rbacToken = localStorage.getItem("token");
  const rbacRole = localStorage.getItem("role");
  if (rbacToken && ["admin", "manager", "staff"].includes(rbacRole)) {
    config.headers.Authorization = `Bearer ${rbacToken}`;
  }

  return config;
});

// Response interceptor to handle token refresh automatically
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const parsed = JSON.parse(user);
          const refreshToken = parsed.refreshToken;
          
          if (refreshToken) {
            // Request a fresh access token
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { accessToken } = response.data;
            
            // Save updated access token
            parsed.accessToken = accessToken;
            parsed.token = accessToken; // backward compatibility
            localStorage.setItem("user", JSON.stringify(parsed));
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return API(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed, logging out:", refreshError);
        localStorage.removeItem("user");
        window.location.href = "/login?session=expired";
      }
    }
    return Promise.reject(error);
  }
);

// =======================
// Products APIs
// =======================

// Get all products (supports pagination, search, category)
export const getProducts = (params) => API.get("/products", { params });

// Get single product
export const getProductById = (id) => API.get(`/products/${id}`);

// Create product (supports multipart form data for image upload)
export const createProduct = (formData) =>
  API.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Update product (supports multipart form data for image upload)
export const updateProduct = (id, formData) =>
  API.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Delete product
export const deleteProduct = (id) => API.delete(`/products/${id}`);


// =======================
// Orders APIs
// =======================

// Get all orders (supports search, status)
export const getOrders = (params) => API.get("/orders", { params });

// Get order by ID
export const getOrderById = (id) => API.get(`/orders/${id}`);

// Create order
export const createOrder = (orderData) => API.post("/orders", orderData);

// Process facility-wise package order bundle automatically
export const processOrderBundle = (bundleData) => API.post("/orders/process", bundleData);

// Update order
export const updateOrder = (id, orderData) => API.put(`/orders/${id}`, orderData);

// Delete order
export const deleteOrder = (id) => API.delete(`/orders/${id}`);


// =======================
// Customers APIs
// =======================

// Get all customers (supports search)
export const getCustomers = (params) => API.get("/customers", { params });

// Get customer by ID
export const getCustomerById = (id) => API.get(`/customers/${id}`);

// Create customer
export const createCustomer = (customerData) => API.post("/customers", customerData);

// Update customer
export const updateCustomer = (id, customerData) => API.put(`/customers/${id}`, customerData);

// Delete customer
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);


// =======================
// Inventory APIs
// =======================

// Get inventory
export const getInventory = (params) => API.get("/inventory", { params });

// Update stock
export const updateInventory = (id, inventoryData) => API.put(`/inventory/${id}`, inventoryData);


// =======================
// Reports APIs
// =======================

// Get reports
export const getSalesReport = (params) => API.get("/reports/sales", { params });
export const getRevenueReport = (params) => API.get("/reports/revenue", { params });
export const getInventoryReport = (params) => API.get("/reports/inventory", { params });


// =======================
// Notifications APIs
// =======================

// Get notifications
export const getNotifications = () => API.get("/notifications");


// =======================
// Settings APIs
// =======================

// Get settings
export const getSettings = () => API.get("/settings");

// Update settings
export const updateSettings = (settingsData) => API.put("/settings", settingsData);


// =======================
// Dashboard APIs
// =======================

export const getDashboardStats = () => API.get("/dashboard/stats");
export const getDashboardCharts = () => API.get("/dashboard/charts");
export const getRecentOrders = () => API.get("/dashboard/recent-orders");


// =======================
// Authentication APIs
// =======================

// Login
export const loginUser = (loginData) => API.post("/auth/login", loginData);

// Quick Mock Login Bypass
export const quickMockLogin = (loginData) => API.post("/auth/quick-login", loginData);

// Register
export const registerUser = (registerData) => API.post("/auth/register", registerData);

// Logout
export const logoutUser = (data) => API.post("/auth/logout", data);

// Get current user profile details
export const getUserProfile = () => API.get("/auth/me");

// Get security audit logs
export const getAuditLogs = () => API.get("/auth/audit-logs");

// Update user profile (supports avatar upload)
export const updateUserProfile = (formData) =>
  API.put("/auth/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Change user password
export const changeUserPassword = (passwordData) => API.put("/auth/change-password", passwordData);

// Resend verification email
export const resendVerificationEmail = (email) => API.post("/auth/resend-verification", { email });

// Update login notification email preferences
export const updateLoginNotificationPrefs = (enabled) => API.put("/auth/login-notifications", { enabled });

// Get login notification email preferences
export const getLoginNotificationPrefs = () => API.get("/auth/login-notifications");


// =======================
// B2B / Quotations APIs
// =======================
export const getQuotations = (params) => API.get('/b2b/quotations', { params });
export const getQuotationById = (id) => API.get(`/b2b/quotations/${id}`);
export const createQuotation = (data) => API.post('/b2b/quotations', data);
export const updateQuotation = (id, data) => API.put(`/b2b/quotations/${id}`, data);
export const deleteQuotation = (id) => API.delete(`/b2b/quotations/${id}`);
export const convertQuotationToOrder = (id) => API.post(`/b2b/quotations/${id}/convert`);

// =======================
// B2B / Delivery Tracking APIs
// =======================
export const getDeliveries = (params) => API.get('/b2b/deliveries', { params });
export const getDeliveryById = (id) => API.get(`/b2b/deliveries/${id}`);
export const createDelivery = (data) => API.post('/b2b/deliveries', data);
export const updateDelivery = (id, data) => API.put(`/b2b/deliveries/${id}`, data);
export const updateDeliveryStatus = (id, status) => API.patch(`/b2b/deliveries/${id}/status`, { status });

// =======================
// B2B / Salesman Visit APIs
// =======================
export const getSalesmanVisits = (params) => API.get('/b2b/visits', { params });
export const createSalesmanVisit = (data) => API.post('/b2b/visits', data);
export const updateSalesmanVisit = (id, data) => API.put(`/b2b/visits/${id}`, data);
export const deleteSalesmanVisit = (id) => API.delete(`/b2b/visits/${id}`);

// =======================
// B2B / Reorder APIs
// =======================
export const getReorders = (params) => API.get('/b2b/reorders', { params });
export const getReorderSuggestions = () => API.get('/b2b/reorders/suggestions');
export const createReorder = (data) => API.post('/b2b/reorders', data);
export const approveReorder = (id) => API.patch(`/b2b/reorders/${id}/approve`);

// =======================
// B2B / Contract Pricing APIs
// =======================
export const getContracts = (params) => API.get('/b2b/contracts', { params });
export const createContract = (data) => API.post('/b2b/contracts', data);
export const updateContract = (id, data) => API.put(`/b2b/contracts/${id}`, data);
export const deleteContract = (id) => API.delete(`/b2b/contracts/${id}`);
export const getContractPricing = (customerId) => API.get(`/b2b/contracts/pricing/${customerId}`);

// =======================
// B2B / Compliance APIs
// =======================
export const getComplianceRecords = (params) => API.get('/b2b/compliance', { params });
export const createComplianceRecord = (data) => API.post('/b2b/compliance', data);
export const updateComplianceRecord = (id, data) => API.put(`/b2b/compliance/${id}`, data);
export const getComplianceAuditLog = (id) => API.get(`/b2b/compliance/${id}/audit`);

// =======================
// B2B / Warehouse APIs
// =======================
export const getWarehouses = (params) => API.get('/b2b/warehouses', { params });
export const createWarehouse = (data) => API.post('/b2b/warehouses', data);
export const updateWarehouse = (id, data) => API.put(`/b2b/warehouses/${id}`, data);
export const getWarehouseStock = (warehouseId) => API.get(`/b2b/warehouses/${warehouseId}/stock`);
export const addWarehouseStock = (warehouseId, data) => API.post(`/b2b/warehouses/${warehouseId}/stock`, data);
export const updateWarehouseStock = (warehouseId, stockId, data) => API.put(`/b2b/warehouses/${warehouseId}/stock/${stockId}`, data);

// =======================
// B2B / CRM APIs
// =======================
export const getB2bAccounts = (params) => API.get('/b2b/accounts', { params });
export const createB2bAccount = (data) => API.post('/b2b/accounts', data);
export const updateB2bAccount = (id, data) => API.put(`/b2b/accounts/${id}`, data);
export const getB2bAccountById = (id) => API.get(`/b2b/accounts/${id}`);

// Export axios instance
export default API;

// =======================
// Password Reset APIs
// =======================
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => API.post('/auth/reset-password', { token, newPassword });

// =======================
// Login History APIs
// =======================
export const getLoginHistory = () => API.get('/auth/login-history');

// =======================
// Bulk Order API
// =======================
export const createBulkOrder = (data) => API.post('/bulk-order', data);

// =======================
// AI / Insights APIs
// =======================
export const getAiInsights = () => API.get('/ai/insights');
export const getAiAlerts = () => API.get('/ai/alerts');
export const getAiRecommendations = () => API.get('/ai/recommendations');
export const getAiSummary = () => API.get('/ai/summary');
export const getAiMessages = () => API.get('/ai/messages');

// =======================
// Auth shorthand alias
// =======================
export const login = (email, password) => API.post('/auth/login', { email, password });
