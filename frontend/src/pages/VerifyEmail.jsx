import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "./Auth.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage("Invalid verification request: missing token.");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify-email/${token}`);
        setSuccess(true);
        setMessage(response.data?.message || "Email address verified successfully!");
        
        // Auto redirect to login after 3 seconds on success
        setTimeout(() => {
          navigate("/login?verified=success");
        }, 3000);
      } catch (err) {
        setSuccess(false);
        setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1>Email Verification</h1>
        
        {loading ? (
          <p className="auth-subtitle">Verifying your email address, please wait...</p>
        ) : (
          <>
            <div className={`auth-alert ${success ? "success" : "error"}`}>
              {message}
            </div>
            
            <p className="auth-subtitle">
              {success 
                ? "Your account is active. You can now access all features." 
                : "The verification link is invalid or expired."}
            </p>
            
            <div className="auth-footer" style={{ marginTop: "20px" }}>
              <Link to="/login" className="button" style={{ 
                display: "inline-block", 
                padding: "12px 24px", 
                background: "#2563eb", 
                color: "white", 
                borderRadius: "10px", 
                textDecoration: "none",
                fontWeight: "600"
              }}>
                Go to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
