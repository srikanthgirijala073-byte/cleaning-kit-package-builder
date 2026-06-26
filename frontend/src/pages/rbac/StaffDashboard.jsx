import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHardHat, FaShoppingCart, FaBoxes, FaTruck, FaClipboardList, FaEye, FaCheckCircle, FaBell } from "react-icons/fa";
import { useRbacAuth } from "../../context/RbacAuthContext";
import DashboardShell from "../../components/rbac/DashboardShell";
import AlertHub from "../../components/AlertHub";
import { getRecentOrders, getProducts, getInventory } from "../../services/api";

function StaffDashboard() {
  const { rbacUser } = useRbacAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Run API calls independently so one failure doesn't break the others
      try {
        const oRes = await getRecentOrders();
        const orders = Array.isArray(oRes.data) ? oRes.data.slice(0, 5) : [];
        setRecentOrders(orders);
      } catch (err) {
        console.error("Failed to load recent orders:", err);
      }

      try {
        const pRes = await getProducts({ limit: 50 });
        // Use stock_quantity from schema since the DB column is stock_quantity
        const products = pRes.data.products || [];
        setLowStockItems(products.filter(p => Number(p.stock || p.stock_quantity || 0) < 10).slice(0, 5));
      } catch (err) {
        console.error("Failed to load products:", err);
      }

      try {
        const iRes = await getInventory({ limit: 100 });
        setInventory(iRes.data.inventory || []);
      } catch (err) {
        console.error("Failed to load inventory (staff may not have access):", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardShell roleLabel="Staff" accent="#f5a524" icon={<FaHardHat />}>
      <h1 className="ops-welcome-title">Welcome{rbacUser?.name ? `, ${rbacUser.name}` : ""}</h1>
      <p className="ops-welcome-subtitle">
        Staff Operations Panel — manage day-to-day order processing and product tasks.
      </p>

      {/* Quick Actions */}
      <div className="ops-panel">
        <div className="ops-panel-title">Quick Actions</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          <Link to="/orders" className="ops-btn-sm" style={{ background: "#f5a524", textDecoration: "none" }}><FaShoppingCart /> Orders</Link>
          <Link to="/products" className="ops-btn-sm" style={{ background: "#a78bfa", textDecoration: "none" }}><FaBoxes /> Products</Link>
          <Link to="/kit-builder" className="ops-btn-sm" style={{ background: "rgba(255,255,255,0.1)", color: "#eaecf2", textDecoration: "none" }}><FaClipboardList /> Build Kit</Link>
          <Link to="/b2b/delivery-tracker" className="ops-btn-sm" style={{ background: "#2dd4bf", textDecoration: "none" }}><FaTruck /> Deliveries</Link>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="ops-panel">
        <div className="ops-panel-title">Recent Orders to Process</div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr><td colSpan={6} className="ops-empty-row">No orders to display.</td></tr>
              )}
              {recentOrders.map((o, i) => (
                <tr key={o.order_id || i}>
                  <td>ORD{String(o.order_id || i + 1).padStart(3, "0")}</td>
                  <td>{o.customer_name || "Guest"}</td>
                  <td>{o.quantity || 1}</td>
                  <td>₹{Number(o.amount || 0).toLocaleString("en-IN")}</td>
                  <td><span className={`ops-pill ${o.status === "Pending" || o.status === "Processing" ? "ops-pill-inactive" : "ops-pill-active"}`}>{o.status || "Pending"}</span></td>
                  <td><Link to={`/details/${o.order_id}`} style={{ color: "#f5a524", fontSize: "13px" }}><FaEye /> View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 4: AI Alerts */}
      <div className="ops-panel" style={{ borderColor: "var(--ops-focus)" }}>
        <AlertHub orders={recentOrders} inventory={inventory} />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="ops-panel" style={{ borderColor: "var(--ops-danger-dim)" }}>
          <div className="ops-panel-title" style={{ color: "var(--ops-danger)" }}>Low Stock Products</div>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p, i) => (
                  <tr key={p.product_id || i}>
                    <td>{p.name}</td>
                    <td style={{ color: "var(--ops-danger)", fontWeight: 600 }}>{p.stock} units</td>
                    <td>{p.category}</td>
                    <td><Link to="/inventory" style={{ color: "#f5a524", fontSize: "13px" }}><FaEye /> Restock</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default StaffDashboard;
