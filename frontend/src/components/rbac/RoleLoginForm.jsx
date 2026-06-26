import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import "../../styles/rbac.css";

/**
 * Shared dark-themed login card for the Admin / Manager / Staff portals.
 *
 * Props:
 *  - role: "admin" | "manager" | "staff"
 *  - roleLabel: "Admin" | "Manager" | "Staff"
 *  - accent: hex color used for focus rings / buttons / badge
 *  - icon: react-icon element shown in the keycard badge
 *  - description: one-line subtitle under the title
 *  - onLogin(email, password): async function -> resolves on success, throws on failure
 *  - dashboardPath: where to redirect after a successful login
 */
function RoleLoginForm({ role, roleLabel, accent, icon, description, onLogin, dashboardPath }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await onLogin(email, password, rememberMe);
      toast.success("Login successful.");
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || `Invalid ${roleLabel} credentials.`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ops-scope" style={{ "--ops-focus": accent }}>
      <div className="ops-grid-bg" />
      <div
        className="ops-glow"
        style={{ background: accent, top: "8%", left: "55%" }}
      />

      <div className="ops-center-shell">
        <div className="ops-brand-row">
          <div className="ops-brand-mark">CK</div>
          <span className="ops-brand-text">
            <strong>Cleaning Kit</strong> Ops Portal
          </span>
        </div>

        <div className="ops-keycard">
          <span
            className="ops-keycard-icon"
            style={{ background: `${accent}22`, color: accent }}
          >
            {icon}
          </span>
          <span className="ops-mono ops-keycard-label" style={{ color: accent }}>
            {roleLabel} Access
          </span>
          <span className="ops-keycard-strip" style={{ background: accent }} />
        </div>

        <div className="ops-card">
          <h1 className="ops-card-title">Sign in to the {roleLabel} Console</h1>
          <p className="ops-card-subtitle">{description}</p>

          <form onSubmit={handleSubmit}>
            <div className="ops-field">
              <label className="ops-label" htmlFor={`${role}-email`}>
                Email
              </label>
              <div className="ops-input-wrap">
                <input
                  id={`${role}-email`}
                  type="email"
                  className="ops-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="ops-field">
              <label className="ops-label" htmlFor={`${role}-password`}>
                Password
              </label>
              <div className="ops-input-wrap has-toggle">
                <input
                  id={`${role}-password`}
                  type={showPassword ? "text" : "password"}
                  className="ops-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="ops-eye-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="ops-row-between">
              <label className="ops-checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="#" className="ops-link" onClick={(e) => {
                e.preventDefault();
                toast(
                  role === "admin"
                    ? "Admin credentials are fixed. Contact the system owner if you've lost access."
                    : `Forgot your password? Contact your administrator to reset ${roleLabel.toLowerCase()} access.`,
                  { icon: "🔒" }
                );
              }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="ops-submit" disabled={loading}>
              {loading && <span className="ops-spinner" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="ops-back-link">
          <Link to="/portal" className="ops-link">
            ← Back to access portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RoleLoginForm;
