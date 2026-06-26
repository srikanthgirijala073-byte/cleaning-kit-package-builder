import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { login as apiLogin } from "../../services/api";
import { FaStore, FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import "./DealerLogin.css";

function DealerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiLogin(form.email, form.password);
      const data = res.data;
      const user = data.user;
      if (user.role !== "dealer" && user.role !== "dealer_contract") {
        setError("Access denied. This portal is for dealers only.");
        return;
      }
      login(data.accessToken || data.token, user);
      navigate("/dealer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dealer-login-page">
      <div className="dealer-login-card">
        <div className="dealer-login-header">
          <div className="dealer-logo"><FaStore /></div>
          <h1>Dealer Portal</h1>
          <p>Sign in to access your dealer account</p>
        </div>

        {error && <div className="dealer-error">{error}</div>}

        <form onSubmit={handleSubmit} className="dealer-form">
          <div className="dealer-field">
            <label><FaEnvelope /> Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="dealer@example.com"
              required
            />
          </div>
          <div className="dealer-field">
            <label><FaLock /> Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="dealer-submit" disabled={loading}>
            <FaSignInAlt /> {loading ? "Signing In..." : "Sign In to Dealer Portal"}
          </button>
        </form>

        <div className="dealer-demo-hint">
          <strong>Demo Credentials:</strong><br />
          Email: dealer@example.com<br />
          Password: dealer123
        </div>

        <div className="dealer-back">
          <button onClick={() => navigate("/login")}>← Back to Main Login</button>
        </div>
      </div>
    </div>
  );
}

export default DealerLogin;
