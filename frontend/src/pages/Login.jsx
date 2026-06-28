import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useAuth } from "../context/AuthContext";
import OtpModal from "../components/OtpModal";
import { getUserProfile } from "../services/api";
import "./Auth.css";

// Hardcoded role credentials — email/password → role assignment
const ROLE_CREDENTIALS = {
  "srikanthgirijala073@gmail.com": { password: "741852", role: "admin",    name: "Srikanth Girijala" },
  "kt493342@gmail.com":            { password: "789456", role: "manager",  name: "Manager" },
  "jahnavisadhu26@gmail.com":      { password: "741085", role: "staff",    name: "Jahnavi Sadhu" },
};

function Login() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { login, loginWithFirebaseGoogle, otpRequired, setOtpRequired, isAuthenticated, loading: authLoading, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resending, setResending] = useState(false);

  const initializeOAuthSession = (token, refreshToken, historyId) => {
    setLoading(true);
    localStorage.setItem("user", JSON.stringify({ accessToken: token, token, refreshToken, historyId }));
    
    getUserProfile()
      .then((response) => {
        const stored = JSON.parse(localStorage.getItem("user"));
        stored.user = response.data;
        localStorage.setItem("user", JSON.stringify(stored));
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      })
      .catch((err) => {
        console.error("Failed to load Google profile details:", err);
        setError("Session initialization failed.");
        localStorage.removeItem("user");
        setLoading(false);
      });
  };

  // Check URL parameters for verification status and Google Sign-in redirection tokens
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Don't auto-redirect if user was sent here because email is not verified
      const verifiedRequired = searchParams.get("verified");
      if (verifiedRequired === "required") {
        return;
      }
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, location.state, searchParams]);

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "success") {
      setSuccess("Email verified successfully! You can now log in.");
    } else if (verified === "expired") {
      setError("Verification link expired. Please register again.");
    } else if (verified === "failed") {
      setError("Email verification failed. Invalid token.");
    }

    const session = searchParams.get("session");
    if (session === "expired") {
      setError("Session expired. Please sign in again.");
    }

    // Block unverified users trying to access protected pages
    const verifiedRequired = searchParams.get("verified");
    if (verifiedRequired === "required") {
      setError("Your email address has not been verified. Please check your inbox for the verification link or request a new one.");
      setEmailNotVerified(true);
    }

    const googleError = searchParams.get("error");
    if (googleError === "google-failed") {
      setError("Google authentication failed. Please try again.");
    }

    // Direct redirect callback check
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const historyId = searchParams.get("historyId");

    if (token && refreshToken) {
      initializeOAuthSession(token, refreshToken, historyId);
    }
  }, [searchParams]);

  // Message event listener check for popup completions
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "OAUTH_SUCCESS") {
        const { token, refreshToken, historyId, user } = event.data;
        if (token && refreshToken) {
          if (user) {
            localStorage.setItem(
              "user",
              JSON.stringify({ accessToken: token, token, refreshToken, historyId, user })
            );
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
          } else {
            initializeOAuthSession(token, refreshToken, historyId);
          }
        }
      } else if (event.data && event.data.type === "OAUTH_FAILURE") {
        const errMsg = event.data.error || "failed";
        if (errMsg.includes("error")) {
          setError("OAuth login failed: A database connection error occurred. Please verify your MySQL database is online.");
        } else {
          setError(`OAuth authentication failed: ${errMsg.replace("-", " ")}.`);
        }
        setLoading(false);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setEmailNotVerified(false);
    setLoading(true);

    // ── Role-based credential check ──────────────────────────────────────────
    // If the entered email+password matches a hardcoded role credential,
    // bypass the normal auth flow and assign the role directly.
    const emailKey = formData.email.trim().toLowerCase();
    const roleCred = ROLE_CREDENTIALS[emailKey];
    if (roleCred && formData.password === roleCred.password) {
      try {
        const { quickMockLogin } = await import("../services/api");
        const response = await quickMockLogin({
          email: formData.email.trim(),
          role:  roleCred.role,
          name:  roleCred.name,
        });
        const data = response.data;
        if (data && data.accessToken) {
          localStorage.setItem("user", JSON.stringify(data));
          setUser(data.user);
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        } else {
          setError("Login failed: Invalid response from server.");
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || "Login failed. Please try again.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
      return; // stop here — do NOT fall through to normal login
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Get reCAPTCHA token (v3 is invisible - no user interaction needed)
    let recaptchaToken = "";
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("login");
      } catch (recaptchaErr) {
        console.warn("reCAPTCHA execution failed (proceeding anyway):", recaptchaErr);
      }
    }

    const result = await login(
      formData.email,
      formData.password,
      formData.rememberMe,
      recaptchaToken
    );

    setLoading(false);

    if (result.success) {
      if (result.twoFactorRequired) {
        setSuccess(result.message);
      } else {
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
    } else {
      setError(result.message);
      // Check if the error is specifically about email verification
      if (result.emailNotVerified && result.email) {
        setEmailNotVerified(true);
      }
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const { resendVerificationEmail } = await import("../services/api");
      const response = await resendVerificationEmail(formData.email);
      setSuccess(response.data?.message || "Verification email sent! Please check your inbox.");
      setEmailNotVerified(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification email.");
    } finally {
      setResending(false);
    }
  };

  const handleProviderLogin = async (provider) => {
    if (provider === "google") {
      setError("");
      setLoading(true);

      const result = await loginWithFirebaseGoogle();
      setLoading(false);

      if (result.success) {
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Google authentication failed.");
      }
      return;
    }

    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      `/auth/${provider}/select`,
      "oauth-popup",
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );
  };

  const handleQuickLogin = async (role, email, name) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { quickMockLogin } = await import("../services/api");
      const response = await quickMockLogin({ email, role, name });
      
      const data = response.data;
      if (data && data.accessToken) {
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data.user);
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        setError("Quick login failed: Missing authentication token.");
      }
    } catch (error) {
      console.error("Quick login error:", error);
      let errMsg = error.response?.data?.message || "Quick login failed.";
      if (error.code === "ERR_NETWORK" || !error.response) {
        errMsg = "Could not connect to the backend server. Please verify your Node server is running on port 5000.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = () => {
    setOtpRequired(false);
    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page-wrapper">
      {/* Left Panel: Feature & Mockup Showcase */}
      <div className="auth-left-panel">
        <div className="auth-brand">
          <div className="brand-icon">🧹</div>
          <span className="brand-name">Cleaning Kit Builder</span>
        </div>

        <div className="auth-preview-content">
          <h2 className="preview-headline">
            Build & optimize your custom <span>cleaning kit bundles</span> in seconds.
          </h2>
          <p className="preview-subheadline">
            Designed for hotels, offices, hospitals, and schools. Select facilities, configure supply packages, track real-time inventory, and automate procurement.
          </p>

          <div className="mockup-dashboard">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mockup-title">Kit Builder Workspace</div>
            </div>

            <div className="mockup-grid">
              <div className="mockup-stat-card">
                <span className="stat-label">Active Kits</span>
                <div className="stat-val">
                  1,248 <span className="stat-trend">▲ 14%</span>
                </div>
              </div>
              <div className="mockup-stat-card">
                <span className="stat-label">Low Stock</span>
                <div className="stat-val" style={{ color: "#ef4444" }}>
                  3 <span className="stat-trend" style={{ color: "#ef4444" }}>Alert</span>
                </div>
              </div>
              <div className="mockup-stat-card">
                <span className="stat-label">Pending Orders</span>
                <div className="stat-val">
                  18 <span className="stat-trend">▲ 2</span>
                </div>
              </div>
            </div>

            <div className="mockup-chart-box">
              <div className="chart-header">
                <span>Supply Optimization Trend</span>
                <span style={{ color: "#3b82f6" }}>Cost Savings: +24%</span>
              </div>
              <svg className="chart-svg" viewBox="0 0 400 100">
                <path
                  className="chart-line"
                  d="M 0 80 Q 50 70 100 40 T 200 60 T 300 20 T 400 30"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
                <path
                  d="M 0 80 Q 50 70 100 40 T 200 60 T 300 20 T 400 30 L 400 100 L 0 100 Z"
                  fill="url(#chart-grad)"
                  opacity="0.1"
                />
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="floating-alert">
              <div className="alert-dot"></div>
              <div className="alert-txt">
                Low Stock: <span>Floor Cleaner (Liquid)</span> at 8 units.
              </div>
            </div>
          </div>
        </div>

        <div className="auth-preview-footer">
          <p className="testimonial-quote">
            "This package builder saved our university facilities team over 40 hours of spreadsheet configuration this semester."
          </p>
          <p className="testimonial-author">
            — Marcus Vance, Facilities Director
          </p>
        </div>
      </div>

      {/* Right Panel: Form Card */}
      <div className="auth-right-panel">
        <div className="auth-container">
          <div className="auth-card">
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Sign in to manage your cleaning kits</p>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            {emailNotVerified && (
              <div className="verification-prompt">
                <div className="verification-prompt-icon">📧</div>
                <div className="verification-prompt-text">
                  <strong>Email not verified</strong>
                  <span>Check your inbox for the verification link, or click below to receive a new one.</span>
                </div>
                <button
                  className="resend-verification-btn"
                  onClick={handleResendVerification}
                  disabled={resending}
                  type="button"
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="auth-forgot">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="auth-divider">or</div>

            <div className="social-stack">
              {/* Google Button */}
              <button 
                className="social-btn google-btn-oauth" 
                onClick={() => handleProviderLogin('google')}
                disabled={loading}
                type="button"
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

            {/* Customer Sign-Up CTA */}
            <div className="customer-signup-box">
              <div className="customer-signup-text">
                <span className="customer-signup-icon">👤</span>
                <div>
                  <strong>New Customer?</strong>
                  <span>Create a free account to start building your cleaning kits</span>
                </div>
              </div>
              <Link to="/register" className="customer-signup-btn">
                Create Account
              </Link>
            </div>

            <div className="auth-footer" style={{ marginTop: "4px", opacity: 0.55, fontSize: "12px" }}>
              Staff / Ops member? <Link to="/portal">Go to the Ops Access Portal</Link>
            </div>
          </div>
        </div>
      </div>

      {otpRequired && (
        <OtpModal
          onClose={() => setOtpRequired(false)}
          onSuccess={handleOtpSuccess}
        />
      )}
    </div>
  );
}

export default Login;