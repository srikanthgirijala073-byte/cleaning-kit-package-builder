import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  adminLogin as apiAdminLogin,
  managerLogin as apiManagerLogin,
  staffLogin as apiStaffLogin,
  verifyRbacToken,
} from "../services/rbacApi";

const RbacAuthContext = createContext();

const DASHBOARD_PATHS = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  staff: "/staff/dashboard",
};

export const RbacAuthProvider = ({ children }) => {
  const [rbacUser, setRbacUser] = useState(null); // { userId, email, role }
  const [rbacLoading, setRbacLoading] = useState(true);

  // Restore session from localStorage on app load / refresh, and confirm
  // the token is still valid (not expired / not tampered with).
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !["admin", "manager", "staff"].includes(role)) {
      setRbacLoading(false);
      return;
    }

    verifyRbacToken()
      .then((res) => {
        setRbacUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setRbacUser(null);
      })
      .finally(() => setRbacLoading(false));
  }, []);

  const persistSession = (token, role, userInfo) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setRbacUser(userInfo || { role });
  };

  const loginAdmin = async (email, password) => {
    const res = await apiAdminLogin({ email, password });
    persistSession(res.data.token, res.data.role, res.data.user);
    return res.data;
  };

  const loginManager = async (email, password) => {
    const res = await apiManagerLogin({ email, password });
    persistSession(res.data.token, res.data.role, res.data.user);
    return res.data;
  };

  const loginStaff = async (email, password) => {
    const res = await apiStaffLogin({ email, password });
    persistSession(res.data.token, res.data.role, res.data.user);
    return res.data;
  };

  const logoutRbac = (navigate) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRbacUser(null);
    toast.success("Logged out successfully.");
    if (navigate) navigate("/login");
  };

  const value = {
    rbacUser,
    rbacLoading,
    rbacRole: rbacUser?.role || localStorage.getItem("role") || null,
    isRbacAuthenticated: !!rbacUser,
    loginAdmin,
    loginManager,
    loginStaff,
    logoutRbac,
    dashboardPathFor: (role) => DASHBOARD_PATHS[role] || "/login",
  };

  return <RbacAuthContext.Provider value={value}>{children}</RbacAuthContext.Provider>;
};

export const useRbacAuth = () => useContext(RbacAuthContext);

export default RbacAuthContext;
