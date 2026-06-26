import { Link, useLocation } from "react-router-dom";
import "./NotFound.css";

function Unauthorized() {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  return (
    <div
      className="not-found-container"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          fontSize: "80px",
          marginBottom: "20px",
          lineHeight: 1,
        }}
      >
        🚫
      </div>
      <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#ef4444" }}>
        Access Denied
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#6b7280",
          maxWidth: "480px",
          marginBottom: "8px",
          lineHeight: 1.6,
        }}
      >
        You do not have the required permissions to access this page.
      </p>
      <p
        style={{
          fontSize: "14px",
          color: "#9ca3af",
          maxWidth: "480px",
          marginBottom: "32px",
        }}
      >
        If you believe this is a mistake, please contact your administrator or
        try logging in with an account that has the appropriate role.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link
          to={from}
          className="btn-primary"
          style={{
            padding: "12px 28px",
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          ← Go Back
        </Link>
        <Link
          to="/dashboard"
          className="btn-secondary"
          style={{
            padding: "12px 28px",
            background: "#f3f4f6",
            color: "#374151",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;