import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUserTie, FaBoxes, FaShoppingCart, FaWarehouse, FaUsers, FaChartBar, FaPlus, FaEye, FaLightbulb } from "react-icons/fa";
import { useRbacAuth } from "../../context/RbacAuthContext";
import DashboardShell from "../../components/rbac/DashboardShell";
import SmartInsights from "../../components/SmartInsights";
import RecommendationFeed from "../../components/RecommendationFeed";
import AlertHub from "../../components/AlertHub";
import { getDashboardStats, getRecentOrders, getProducts, getInventory, getCustomers } from "../../services/api";
import { generateClientSummary } from "../../services/aiService";

function ManagerDashboard() {
  const { rbacUser } = useRbacAuth();
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0, pendingOrders: 0, lowStockProducts: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, oRes] = await Promise.all([getDashboardStats(), getRecentOrders()]);
        setStats(sRes.data);
        setRecentOrders(Array.isArray(oRes.data) ? oRes.data.slice(0, 5) : []);
      } catch (err) {
        console.error("Error loading manager dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardShell roleLabel="Manager" accent="#2dd4bf" icon={<FaUserTie />}>
      <h1 className="ops-welcome-title">Welcome{rbacUser?.name ? `, ${rbacUser.name}` : ""}</h1>
      <p className="ops-welcome-subtitle">
        Manager Operations Panel — oversee products, orders, inventory, customers, and reports.
      </p>

      {/* Step 4: AI Insights */}
      <div className="ops-panel" style={{ borderColor: "var(--ops-focus)" }}>
        <SmartInsights
          fallbackData={{
            daily: generateClientSummary(recentOrders, [], []),
            orders: { summary: `${stats.totalOrders} total orders, ${stats.pendingOrders} pending` },
          }}
        />
      </div>

      {/* Quick Stats */}
      <div className="ops-panel">
        <div className="ops-panel-title">Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "14px" }}>
          {[
            { label: "Products", value: stats.totalProducts, icon: <FaBoxes />, color: "#2dd4bf" },
            { label: "Orders", value: stats.totalOrders, icon: <FaShoppingCart />, color: "#a78bfa" },
            { label: "Customers", value: stats.totalCustomers, icon: <FaUsers />, color: "#60a5fa" },
            { label: "Pending", value: stats.pendingOrders, icon: <FaChartBar />, color: "#f5a524" },
            { label: "Low Stock", value: stats.lowStockProducts, icon: <FaWarehouse />, color: "#f87171" },
          ].map((item, i) => (
            <div key={i} className="ops-field" style={{ margin: 0, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--ops-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ color: item.color, fontSize: "18px" }}>{item.icon}</span>
                <span style={{ fontSize: "12px", color: "var(--ops-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ops-panel">
        <div className="ops-panel-title">Quick Actions</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          <Link to="/products" className="ops-btn-sm" style={{ background: "#2dd4bf", textDecoration: "none" }}><FaBoxes /> Manage Products</Link>
          <Link to="/orders" className="ops-btn-sm" style={{ background: "#a78bfa", textDecoration: "none" }}><FaShoppingCart /> Manage Orders</Link>
          <Link to="/inventory" className="ops-btn-sm" style={{ background: "#60a5fa", textDecoration: "none" }}><FaWarehouse /> Inventory</Link>
          <Link to="/customers" className="ops-btn-sm" style={{ background: "#f5a524", textDecoration: "none" }}><FaUsers /> Customers</Link>
          <Link to="/reports" className="ops-btn-sm" style={{ background: "rgba(255,255,255,0.1)", color: "#eaecf2", textDecoration: "none" }}><FaChartBar /> Reports</Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="ops-panel">
        <div className="ops-panel-title">Recent Orders</div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="ops-empty-row">No recent orders found.</td></tr>
              )}
              {recentOrders.map((o, i) => (
                <tr key={o.order_id || i}>
                  <td>ORD{String(o.order_id || i + 1).padStart(3, "0")}</td>
                  <td>{o.customer_name || "Guest"}</td>
                  <td>₹{Number(o.amount || 0).toLocaleString("en-IN")}</td>
                  <td><span className={`ops-pill ${o.status === "Delivered" || o.status === "Completed" ? "ops-pill-active" : "ops-pill-inactive"}`}>{o.status || "Pending"}</span></td>
                  <td><Link to={`/details/${o.order_id}`} style={{ color: "#2dd4bf", fontSize: "13px" }}><FaEye /> View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

export default ManagerDashboard;
