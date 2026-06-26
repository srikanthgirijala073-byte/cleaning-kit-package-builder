import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/api";
import "./Auth.css";

function Register() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score, label: "Medium", color: "#f59e0b" };
    return { score, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(formData.password);

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
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agreeTerms) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Get reCAPTCHA token (invisible v3 - no user interaction)
    let recaptchaToken = "";
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("register");
      } catch (recaptchaErr) {
        console.warn("reCAPTCHA execution failed (proceeding anyway):", recaptchaErr);
      }
    }

    setLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.phone,
      formData.address,
      recaptchaToken
    );
    setLoading(false);

    if (result.success) {
      setSuccess(result.message);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } else {
      setError(result.message);
    }
  };

  const handleProviderLogin = (provider) => {
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
      <div className="auth-right-panel" style={{ padding: "60px 40px" }}>
        <div className="auth-container">
          <div className="auth-card" style={{ maxWidth: "500px" }}>
            <h1>Create Account</h1>
            <p className="auth-subtitle">Join us to customize your cleaning kits</p>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

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

              <div>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <input
                  type="text"
                  name="address"
                  placeholder="Shipping Address (Optional)"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
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

              {formData.password && (
                <div className="password-strength-container">
                  <div className="password-strength-bar-wrapper">
                    <div 
                      className="password-strength-bar" 
                      style={{ backgroundColor: strength.score >= 1 ? strength.color : 'rgba(255,255,255,0.05)' }}
                    ></div>
                    <div 
                      className="password-strength-bar" 
                      style={{ backgroundColor: strength.score >= 3 ? strength.color : 'rgba(255,255,255,0.05)' }}
                    ></div>
                    <div 
                      className="password-strength-bar" 
                      style={{ backgroundColor: strength.score >= 5 ? strength.color : 'rgba(255,255,255,0.05)' }}
                    ></div>
                  </div>
                  <div className="password-strength-label">
                    <span>Strength:</span>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                </div>
              )}

              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              <label className="terms-checkbox-container">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                />
                <span>
                  I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>
                </span>
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Create Account"}
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

              {/* Microsoft Button */}
              <button 
                className="social-btn microsoft-btn-oauth" 
                onClick={() => handleProviderLogin('microsoft')}
                disabled={loading}
                type="button"
              >
                <svg viewBox="0 0 23 23" width="20" height="20" className="social-icon">
                  <path d="M0 0h11v11H0z" fill="#F25022" />
                  <path d="M12 0h11v11H12z" fill="#7FBA00" />
                  <path d="M0 12h11v11H0z" fill="#00A4EF" />
                  <path d="M12 12h11v11H12z" fill="#FFB900" />
                </svg>
                Continue with Microsoft
              </button>

              {/* GitHub Button */}
              <button 
                className="social-btn github-btn-oauth" 
                onClick={() => handleProviderLogin('github')}
                disabled={loading}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" className="social-icon" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;