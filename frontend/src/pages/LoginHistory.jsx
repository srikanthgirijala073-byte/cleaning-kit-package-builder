import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "./LoginHistory.css";

function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const token = user.accessToken || user.token;
        const response = await axios.get(`${API_BASE_URL}/auth/login-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(response.data);
      } catch (err) {
        setError("Failed to retrieve login history logs.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="login-history-container">
      <div className="login-history-header">
        <h1>Login Activity History</h1>
        <p>Review active sessions and login activities on your account.</p>
      </div>

      {loading ? (
        <div className="history-loader">Loading login history logs...</div>
      ) : error ? (
        <div className="history-error">{error}</div>
      ) : (
        <div className="history-table-card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Login Date & Time</th>
                <th>Device</th>
                <th>Browser</th>
                <th>IP Address</th>
                <th>Approximate Location</th>
                <th>Logout Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log.id}>
                  <td className="log-date">{formatDate(log.login_date)}</td>
                  <td>{log.device_name || "Unknown Device"}</td>
                  <td>{log.browser || "Unknown Browser"}</td>
                  <td className="log-ip">{log.ip_address}</td>
                  <td>{log.location || "Unknown"}</td>
                  <td>
                    {log.logout_time ? (
                      <span className="session-logged-out">{formatDate(log.logout_time)}</span>
                    ) : (
                      <span className="session-active">Active Session</span>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-history">No login records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LoginHistory;
