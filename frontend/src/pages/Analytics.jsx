import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import StatisticsCard from "../components/StatisticsCard";
import AlertCard from "../components/AlertCard";
import {
  getDashboardStats,
  getDashboardCharts,
  getRecentOrders,
} from "../services/api";
import "./Reports.css";
import "./Dashboard.css";

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, chartsRes, ordersRes] = await Promise.all([
          getDashboardStats().catch(() => ({ data: {} })),
          getDashboardCharts().catch(() => ({ data: {} })),
          getRecentOrders().catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data || {});
        setCharts(chartsRes.data || {});
        setRecentOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalRevenue = Number(stats.totalRevenue || stats.revenue || 0);
  const totalOrders = Number(stats.totalOrders || stats.orders || 0);
  const totalCustomers = Number(stats.totalCustomers || stats.customers || 0);
  const totalProducts = Number(stats.totalProducts || stats.products || 0);
  const completedOrders = Number(stats.completedOrders || 0);
  const pendingOrders = Number(stats.pendingOrders || 0);
  const conversionRate =
    totalOrders > 0
      ? ((completedOrders / totalOrders) * 100).toFixed(1)
      : "0.0";

  const statusMap = {};
  if (Array.isArray(charts.statusDistribution)) {
    charts.statusDistribution.forEach((row) => {
      statusMap[row.status] = row.count;
    });
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>📊 Analytics</h1>
        <p>Real-time business insights — all data pulled live from the database.</p>
      </div>

      {error && (
        <AlertCard title="Error loading analytics" message={error} type="error" />
      )}

      {/* KPI Cards */}
      <div className="reports-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="stat-card" style={cardStyle("#2563eb")}>
          <div className="stat-icon">📦</div>
          <div className="stat-value">{totalOrders.toLocaleString("en-IN")}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card" style={cardStyle("#10b981")}>
          <div className="stat-icon">💰</div>
          <div className="stat-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card" style={cardStyle("#f59e0b")}>
          <div className="stat-icon">👥</div>
          <div className="stat-value">{totalCustomers.toLocaleString("en-IN")}</div>
          <div className="stat-label">Customers</div>
        </div>
        <div className="stat-card" style={cardStyle("#8b5cf6")}>
          <div className="stat-icon">🛒</div>
          <div className="stat-value">{totalProducts.toLocaleString("en-IN")}</div>
          <div className="stat-label">Products</div>
        </div>
        <div className="stat-card" style={cardStyle("#06b6d4")}>
          <div className="stat-icon">✅</div>
          <div className="stat-value">{completedOrders.toLocaleString("en-IN")}</div>
          <div className="stat-label">Completed Orders</div>
        </div>
        <div className="stat-card" style={cardStyle("#f97316")}>
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{pendingOrders.toLocaleString("en-IN")}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card" style={cardStyle("#ec4899")}>
          <div className="stat-icon">📈</div>
          <div className="stat-value">{conversionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      {Object.keys(statusMap).length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitle}>Order Status Breakdown</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} style={badgeStyle}>
                <strong>{count}</strong> {status}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Revenue (if available) */}
      {Array.isArray(charts.monthlyData) && charts.monthlyData.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitle}>Monthly Revenue</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={th}>Month</th>
                  <th style={th}>Orders</th>
                  <th style={th}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {charts.monthlyData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>{row.month}</td>
                    <td style={td}>{row.orders || row.order_count || "—"}</td>
                    <td style={td}>₹{Number(row.revenue || row.total_revenue || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No orders placed yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={th}>#</th>
                  <th style={th}>Customer</th>
                  <th style={th}>Status</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 10).map((order, i) => (
                  <tr key={order.order_id || i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>{order.order_id}</td>
                    <td style={td}>{order.customer_name || order.name || "—"}</td>
                    <td style={td}>
                      <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", background: statusColor(order.status), color: "#fff" }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={td}>₹{Number(order.total_amount || order.amount || 0).toLocaleString("en-IN")}</td>
                    <td style={td}>{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = (color) => ({
  background: "var(--bg-secondary)",
  border: `2px solid ${color}22`,
  borderRadius: "12px",
  padding: "1.25rem",
  textAlign: "center",
  borderTop: `4px solid ${color}`,
});
const sectionStyle = { background: "var(--bg-secondary)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" };
const sectionTitle = { marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 600 };
const badgeStyle = { background: "var(--bg-primary)", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.85rem", border: "1px solid var(--border)" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" };
const th = { padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" };
const td = { padding: "0.75rem 1rem", whiteSpace: "nowrap" };

function statusColor(s) {
  const map = { placed: "#2563eb", processing: "#f59e0b", packed: "#8b5cf6", shipped: "#06b6d4", delivered: "#10b981", completed: "#10b981", cancelled: "#ef4444" };
  return map[s] || "#6b7280";
}

export default Analytics;
