import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "./Auth.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid password reset request. Missing token.");
    }
  }, [token]);

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

    if (!token) {
      setError("Cannot submit: missing verification token.");
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

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        newPassword: formData.password,
      });

      setSuccess(response.data.message);
      setFormData({ password: "", confirmPassword: "" });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset link expired or invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-right-panel" style={{ flex: 1 }}>
        <div className="auth-container">
          <div className="auth-card">
            <h1>Reset Password</h1>
            <p className="auth-subtitle">Establish a secure new password for your account.</p>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || !token}
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading || !token}
                  required
                />
              </div>

              <button type="submit" disabled={loading || !token}>
                {loading ? "Resetting..." : "Save Password"}
              </button>
            </form>

            <div className="auth-footer">
              Back to <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
