import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

function ProtectedRoute({ children, requireVerified = true }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification if required
  // Users authenticated via Google are considered verified
  if (requireVerified && user && !user.isFirebaseAuth) {
    if (!user.email_verified) {
      return (
        <Navigate
          to="/login?verified=required"
          state={{ from: location }}
          replace
        />
      );
    }
  }

  return children;
}

export default ProtectedRoute;