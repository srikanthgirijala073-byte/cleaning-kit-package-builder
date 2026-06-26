import axios from "axios";
import { API_BASE_URL } from "./api";

// Dedicated axios instance for the Admin/Manager/Staff RBAC auth system.
// Kept separate from the main `API` instance in services/api.js, which
// reads its token from a different localStorage key ("user") used by
// the existing customer-facing auth flow.
const rbacAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

rbacAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  // Only attach the token for RBAC roles (admin/manager/staff) so it never
  // collides with the customer auth token on shared endpoints.
  if (token && ["admin", "manager", "staff"].includes(role)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =======================
// Auth
// =======================
export const adminLogin = (data) => rbacAPI.post("/auth/admin/login", data);
export const managerLogin = (data) => rbacAPI.post("/auth/manager/login", data);
export const staffLogin = (data) => rbacAPI.post("/auth/staff/login", data);
export const verifyRbacToken = () => rbacAPI.get("/auth/rbac/me");

// =======================
// Admin management of Manager/Staff accounts
// =======================
export const createManager = (data) => rbacAPI.post("/admin/managers", data);
export const listManagers = () => rbacAPI.get("/admin/managers");
export const updateManagerStatus = (id, status) =>
  rbacAPI.patch(`/admin/managers/${id}/status`, { status });
export const deleteManager = (id) => rbacAPI.delete(`/admin/managers/${id}`);

export const createStaff = (data) => rbacAPI.post("/admin/staff", data);
export const listStaff = () => rbacAPI.get("/admin/staff");
export const updateStaffStatus = (id, status) =>
  rbacAPI.patch(`/admin/staff/${id}/status`, { status });
export const deleteStaff = (id) => rbacAPI.delete(`/admin/staff/${id}`);

export default rbacAPI;
