import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAiAlerts, generateClientAlerts } from "../services/aiService";
import {
  FaBell,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";
import "./AlertHub.css";

function AlertHub({ orders, inventory }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await getAiAlerts();
      setAlerts(res.data?.alerts || []);
    } catch {
      // Client-side fallback
      if (orders || inventory) {
        setAlerts(generateClientAlerts(orders, inventory));
      }
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (id) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  const getAlertIcon = (type) => {
    switch (type) {
      case "error":
        return <FaTimesCircle />;
      case "warning":
        return <FaExclamationTriangle />;
      case "info":
        return <FaInfoCircle />;
      case "success":
        return <FaCheckCircle />;
      default:
        return <FaBell />;
    }
  };

  const getAlertClass = (severity) => {
    switch (severity) {
      case "critical":
        return "alert-critical";
      case "high":
        return "alert-high";
      case "medium":
        return "alert-medium";
      default:
        return "alert-low";
    }
  };

  if (loading) {
    return (
      <div className="alert-hub">
        <div className="alert-hub-header">
          <h3><FaBell /> AI Alerts</h3>
        </div>
        <div className="alert-loading">Scanning system...</div>
      </div>
    );
  }

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="alert-hub">
      <div className="alert-hub-header">
        <h3><FaBell /> AI Alerts</h3>
        <span className="alert-count">{visibleAlerts.length} active</span>
      </div>

      <div className="alert-list">
        {visibleAlerts.map((alert, idx) => (
          <div
            key={alert.id || idx}
            className={`alert-item ${getAlertClass(alert.severity)}`}
          >
            <div className="alert-item-icon">{getAlertIcon(alert.type)}</div>
            <div className="alert-item-content">
              <div className="alert-item-title">{alert.title}</div>
              <div className="alert-item-message">{alert.message}</div>
            </div>
            <div className="alert-item-actions">
              {alert.actionable && alert.action_link && (
                <Link to={alert.action_link} className="alert-action-btn">
                  {alert.action_label || "View"}
                </Link>
              )}
              <button
                className="alert-dismiss-btn"
                onClick={() => dismissAlert(alert.id)}
                type="button"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertHub;
