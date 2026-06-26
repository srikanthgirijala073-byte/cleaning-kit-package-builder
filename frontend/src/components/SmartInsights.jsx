import { useState, useEffect } from "react";
import { getAiSummary } from "../services/aiService";
import {
  FaSun,
  FaShoppingCart,
  FaRupeeSign,
  FaUsers,
  FaBoxes,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./SmartInsights.css";

function SmartInsights({ fallbackData }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await getAiSummary();
      setSummary(res.data);
    } catch (err) {
      // Use fallback if backend unavailable
      if (fallbackData) {
        setSummary(fallbackData);
      } else {
        setError("Could not load insights");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="smart-insights">
        <div className="insights-header">
          <h3><FaSun /> AI Daily Summary</h3>
        </div>
        <div className="insights-loading">Loading insights...</div>
      </div>
    );
  }

  if (error && !summary) {
    return null; // Silently hide if no data available
  }

  const daily = summary?.daily || summary;
  const orders = summary?.orders || summary;

  return (
    <div className="smart-insights">
      <div className="insights-header">
        <h3><FaSun /> AI Daily Summary</h3>
        {daily?.date && (
          <span className="insights-date">
            {new Date(daily.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <div className="insights-grid">
        <div className="insight-card insight-orders">
          <div className="insight-icon">
            <FaShoppingCart />
          </div>
          <div className="insight-value">{daily?.orders_today ?? "—"}</div>
          <div className="insight-label">Orders Today</div>
        </div>

        <div className="insight-card insight-revenue">
          <div className="insight-icon">
            <FaRupeeSign />
          </div>
          <div className="insight-value">
            ₹
            {(daily?.revenue_today ?? 0).toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="insight-label">Revenue Today</div>
        </div>

        <div className="insight-card insight-customers">
          <div className="insight-icon">
            <FaUsers />
          </div>
          <div className="insight-value">{daily?.new_customers ?? "—"}</div>
          <div className="insight-label">New Customers</div>
        </div>

        <div className="insight-card insight-pending">
          <div className="insight-icon">
            <FaExclamationTriangle />
          </div>
          <div className="insight-value">{daily?.pending_orders ?? "—"}</div>
          <div className="insight-label">Pending Orders</div>
        </div>
      </div>

      {orders?.summary && (
        <div className="insights-summary">{orders.summary}</div>
      )}

      {daily?.summary && !orders?.summary && (
        <div className="insights-summary">{daily.summary}</div>
      )}
    </div>
  );
}

export default SmartInsights;
