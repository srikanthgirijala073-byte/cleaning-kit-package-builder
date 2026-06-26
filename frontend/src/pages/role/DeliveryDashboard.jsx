import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDeliveries } from "../../services/api";
import { FaTruck, FaCheckCircle, FaClock, FaBoxOpen, FaMapMarkerAlt, FaSignOutAlt } from "react-icons/fa";
import "./RoleDashboard.css";

function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeliveries({}).then(r => setDeliveries(r.data.deliveries || r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: deliveries.length,
    delivered: deliveries.filter(d => d.status === "Delivered").length,
    inTransit: deliveries.filter(d => d.status === "In Transit").length,
    packed: deliveries.filter(d => d.status === "Packed").length,
  };

  const statusColor = (s) => ({ Delivered:"#10b981", "In Transit":"#2563eb", Packed:"#f59e0b", Scheduled:"#8b5cf6", Failed:"#ef4444" }[s] || "#64748b");

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="role-dashboard delivery-theme">
      <div className="role-header">
        <div className="role-header-left">
          <div className="role-avatar"><FaTruck /></div>
          <div>
            <h1>Delivery Coordinator</h1>
            <p>Welcome, {user?.name || "Coordinator"}</p>
          </div>
        </div>
        <div className="role-header-actions">
          <button className="role-action-btn primary" onClick={() => navigate("/b2b/delivery-tracker")}><FaTruck /> Track Deliveries</button>
          <button className="role-action-btn secondary" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="role-stats">
        <div className="role-stat-card"><FaBoxOpen className="stat-icon" style={{color:"#2563eb"}} /><div><div className="stat-val">{stats.total}</div><div className="stat-lbl">Total Shipments</div></div></div>
        <div className="role-stat-card"><FaCheckCircle className="stat-icon" style={{color:"#10b981"}} /><div><div className="stat-val">{stats.delivered}</div><div className="stat-lbl">Delivered</div></div></div>
        <div className="role-stat-card"><FaTruck className="stat-icon" style={{color:"#2563eb"}} /><div><div className="stat-val">{stats.inTransit}</div><div className="stat-lbl">In Transit</div></div></div>
        <div className="role-stat-card"><FaClock className="stat-icon" style={{color:"#f59e0b"}} /><div><div className="stat-val">{stats.packed}</div><div className="stat-lbl">Packed/Ready</div></div></div>
      </div>

      <div className="role-card">
        <h2>Today's Deliveries</h2>
        {loading ? <p>Loading...</p> : (
          <div className="role-table-wrap">
            <table className="role-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Address</th><th>Driver</th><th>Est. Date</th><th>Status</th></tr></thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id}>
                    <td>ORD{String(d.order_id || "").padStart(3,"0")}</td>
                    <td>{d.customer_name}</td>
                    <td><FaMapMarkerAlt style={{color:"#ef4444"}} /> {d.address}</td>
                    <td>{d.driver || "Unassigned"}</td>
                    <td>{d.estimated_date || "—"}</td>
                    <td><span className="role-status-pill" style={{background:statusColor(d.status)+"22",color:statusColor(d.status)}}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="role-card-footer">
          <button className="role-link-btn" onClick={() => navigate("/b2b/delivery-tracker")}>Full Delivery Tracker →</button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryDashboard;
