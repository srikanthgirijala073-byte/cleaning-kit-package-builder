import { useState } from "react";
import { Link } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "./Auth.css";

function ForgotPassword() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Get reCAPTCHA token (invisible v3 - no user interaction)
    let recaptchaToken = "";
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("forgot_password");
      } catch (recaptchaErr) {
        console.warn("reCAPTCHA execution failed (proceeding anyway):", recaptchaErr);
      }
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email, recaptchaToken });
      setSuccess(response.data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-right-panel" style={{ flex: 1 }}>
        <div className="auth-container">
          <div className="auth-card">
            <h1>Forgot Password</h1>
            <p className="auth-subtitle">Enter your email and we'll send you a password reset link.</p>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Sending link..." : "Send Reset Link"}
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

export default ForgotPassword;