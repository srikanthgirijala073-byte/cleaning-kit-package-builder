import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrders, getProducts } from "../../services/api";
import { FaStore, FaShoppingBag, FaBoxOpen, FaFileInvoiceDollar, FaSignOutAlt, FaPlus, FaChartLine, FaPhone } from "react-icons/fa";
import "./RoleDashboard.css";

function DealerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOrders({ limit: 10 }).catch(() => ({ data: { orders: [] } })),
      getProducts({ limit: 12 }).catch(() => ({ data: { products: [] } })),
    ]).then(([or, pr]) => {
      setOrders(or.data.orders || []);
      setProducts(pr.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  const revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
  const handleLogout = () => { logout(); navigate("/dealer/login"); };

  return (
    <div className="role-dashboard dealer-theme">
      <div className="role-header">
        <div className="role-header-left">
          <div className="role-avatar"><FaStore /></div>
          <div>
            <h1>Dealer Dashboard</h1>
            <p>Welcome, {user?.name || "Dealer"} · Partner Portal</p>
          </div>
        </div>
        <div className="role-header-actions">
          <button className="role-action-btn primary" onClick={() => navigate("/b2b/catalog")}><FaBoxOpen /> Product Catalog</button>
          <button className="role-action-btn primary" onClick={() => navigate("/b2b/bulk-orders")}><FaPlus /> Place Order</button>
          <button className="role-action-btn secondary" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="role-stats">
        <div className="role-stat-card"><FaShoppingBag className="stat-icon" style={{color:"#0ea5e9"}} /><div><div className="stat-val">{orders.length}</div><div className="stat-lbl">Total Orders</div></div></div>
        <div className="role-stat-card"><FaChartLine className="stat-icon" style={{color:"#10b981"}} /><div><div className="stat-val">₹{Math.round(revenue/1000)}k</div><div className="stat-lbl">Total Purchases</div></div></div>
        <div className="role-stat-card"><FaBoxOpen className="stat-icon" style={{color:"#f59e0b"}} /><div><div className="stat-val">{products.length}</div><div className="stat-lbl">Products Available</div></div></div>
        <div className="role-stat-card"><FaFileInvoiceDollar className="stat-icon" style={{color:"#8b5cf6"}} /><div><div className="stat-val">{orders.filter(o=>o.status==="Pending").length}</div><div className="stat-lbl">Pending Orders</div></div></div>
      </div>

      <div className="dealer-quick-links">
        {[
          { icon:<FaBoxOpen/>,   label:"Browse Catalog",    path:"/b2b/catalog" },
          { icon:<FaPlus/>,      label:"Bulk Order",        path:"/b2b/bulk-orders" },
          { icon:<FaShoppingBag/>,label:"My Orders",        path:"/orders" },
          { icon:<FaFileInvoiceDollar/>, label:"Quotations", path:"/b2b/quotations" },
          { icon:<FaChartLine/>, label:"Contract Pricing",  path:"/b2b/contracts" },
          { icon:<FaPhone/>,     label:"Support",           path:"/notifications" },
        ].map(l => (
          <div key={l.path} className="dealer-quick-link" onClick={() => navigate(l.path)}>
            <span className="dl-icon">{l.icon}</span>
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="role-card">
        <h2>My Recent Orders</h2>
        {loading ? <p style={{padding:"16px",color:"#94a3b8"}}>Loading...</p> : orders.length === 0 ? (
          <div style={{padding:"24px",textAlign:"center",color:"#94a3b8"}}>
            <p>No orders yet. <button className="role-link-btn" onClick={() => navigate("/b2b/bulk-orders")}>Place your first order →</button></p>
          </div>
        ) : (
          <div className="role-table-wrap">
            <table className="role-table">
              <thead><tr><th>Order #</th><th>Package</th><th>Amount</th><th>Facility</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.order_id}>
                    <td>ORD{String(o.order_id).padStart(3,"0")}</td>
                    <td>{o.package_name}</td>
                    <td>₹{o.amount?.toLocaleString("en-IN")}</td>
                    <td>{o.facility_type || "—"}</td>
                    <td><span className="role-status-pill" style={{background:"#dbeafe",color:"#1d4ed8"}}>{o.status}</span></td>
                    <td style={{fontSize:"12px",color:"#64748b"}}>{o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : "—"}</td>
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

export default DealerDashboard;
