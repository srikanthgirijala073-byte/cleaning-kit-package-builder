import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../services/api";
import GoogleChooserModal from "../components/GoogleChooserModal";
import "./Welcome.css";

function Welcome() {
  const { isAuthenticated, loading, loginWithFirebaseGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const [error, setError] = useState("");

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "OAUTH_SUCCESS") {
        const { token, refreshToken, historyId } = event.data;
        if (token && refreshToken) {
          localStorage.setItem("user", JSON.stringify({ accessToken: token, token, refreshToken, historyId }));
          // Redirect to dashboard
          window.location.href = "/dashboard";
        }
      } else if (event.data && event.data.type === "OAUTH_FAILURE") {
        const errMsg = event.data.error || "failed";
        if (errMsg.includes("error")) {
          setError("OAuth login failed: A database connection error occurred. Please verify your MySQL database is online.");
        } else {
          setError(`OAuth authentication failed: ${errMsg.replace("-", " ")}.`);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const handleProviderLogin = (provider) => {
    setError("");
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      `${BACKEND_URL}/api/auth/${provider}`,
      "oauth-popup",
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );
  };

  if (loading || isAuthenticated) {
    return (
      <div className="welcome-loading">
        <div className="welcome-spinner"></div>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      {/* Animated background elements */}
      <div className="bg-bubble bubble-1"></div>
      <div className="bg-bubble bubble-2"></div>
      <div className="bg-bubble bubble-3"></div>

      <div className="welcome-card">
        {/* Logo and Brand */}
        <div className="welcome-brand">
          <div className="brand-logo">🧹</div>
          <h1>Cleaning Kit</h1>
          <p className="brand-tagline">Package Builder & Supply Manager</p>
        </div>

        <h2 className="welcome-title">Get Started</h2>
        <p className="welcome-subtitle">Sign in or create an account to start configuring your packages.</p>

        {error && <div className="auth-alert error" style={{ marginBottom: "20px" }}>{error}</div>}

        {/* Social Buttons Stack */}
        <div className="social-stack">
          {/* Google Button */}
          <button 
            className="social-btn google-btn-oauth" 
            onClick={() => handleProviderLogin('google')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" className="social-icon">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.29c1.92,-1.77 3.02,-4.38 3.02,-7.4C21.65,11.75 21.55,11.4 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.5c2.43,0 4.47,-0.8 5.96,-2.2l-3.29,-2.6c-0.9,0.6 -2.07,0.97 -3.67,0.97 -2.83,0 -5.23,-1.91 -6.08,-4.48H1.53v2.7C3.02,17.92 7.18,20.5 12,20.5z" fill="#34A853" />
              <path d="M5.92,12.19c-0.22,-0.66 -0.35,-1.37 -0.35,-2.09s0.13,-1.43 0.35,-2.09V5.31H1.53c-0.78,1.57 -1.23,3.34 -1.23,5.19s0.45,3.62 1.23,5.19L5.92,12.19z" fill="#FBBC05" />
              <path d="M12,5.23c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.51 14.43,2 12,2C7.18,2 3.02,4.58 1.53,7.61l4.39,3.38C6.77,8.42 9.17,6.23 12,5.23z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="welcome-divider">
          <span>or</span>
        </div>

        {/* Traditional Credentials Stack */}
        <div className="auth-actions-stack">
          <Link to="/login" className="welcome-btn welcome-primary-btn">
            Sign In with Email
          </Link>
          <Link to="/register" className="welcome-btn welcome-secondary-btn">
            Create Account
          </Link>
        </div>

        <p className="welcome-terms">
          By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>
      </div>
      {searchParams.get("chooser") === "true" && (
        <GoogleChooserModal
          onClose={() => setSearchParams({})}
        />
      )}
    </div>
  );
}

export default Welcome;
