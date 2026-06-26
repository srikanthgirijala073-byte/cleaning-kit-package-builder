import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { hasRoutePermission } from "../utils/roles";

/**
 * RoleProtectedRoute checks both authentication AND role-based permissions.
 * If the user does not have the required role, they are redirected to /unauthorized.
 */
function RoleProtectedRoute({ children, requiredRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || "customer";

  // If specific roles are provided, check against those
  if (requiredRoles && Array.isArray(requiredRoles)) {
    if (!requiredRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  } else {
    // Otherwise, use the route-based permissions
    const path = location.pathname;
    if (!hasRoutePermission(userRole, path)) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  return children;
}

export default RoleProtectedRoute;
