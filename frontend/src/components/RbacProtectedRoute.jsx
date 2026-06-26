import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useRbacAuth } from "../context/RbacAuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Guards /admin/*, /manager/*, /staff/* routes.
 * - No token -> redirect to /login with a toast.
 * - Token belongs to a different role -> redirect to /login with a toast
 *   (e.g. a Manager trying to open an Admin page, or a Staff member
 *   trying to open an Admin/Manager page).
 */
function RbacProtectedRoute({ children, requiredRole }) {
  const { rbacUser, rbacLoading, isRbacAuthenticated } = useRbacAuth();
  const location = useLocation();
  const hasWarned = useRef(false);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const hasValidShape = token && role;

  const isAllowed = isRbacAuthenticated && rbacUser?.role === requiredRole;
  const shouldDeny = !rbacLoading && (!hasValidShape || !isAllowed);

  useEffect(() => {
    if (shouldDeny && !hasWarned.current) {
      hasWarned.current = true;
      toast.error("You are not authorized to access this page.");
    }
  }, [shouldDeny]);

  if (rbacLoading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (shouldDeny) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default RbacProtectedRoute;
