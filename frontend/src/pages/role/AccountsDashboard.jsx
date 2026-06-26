import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getContracts, getOrders } from "../../services/api";
import { FaWallet, FaFileContract, FaRupeeSign, FaChartBar, FaSignOutAlt, FaCheckCircle } from "react-icons/fa";
import "./RoleDashboard.css";

function AccountsDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getContracts({}).catch(() => ({ data: { contracts: [] } })),
      getOrders({}).catch(() => ({ data: { orders: [] } })),
    ]).then(([cr, or]) => {
      setContracts(cr.data.contracts || []);
      setOrders(or.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  const revenue = orders.filter(o => ["Delivered","Completed"].includes(o.status)).reduce((s,o) => s+o.amount, 0);
  const pending = orders.filter(o => o.status === "Pending").reduce((s,o) => s+o.amount, 0);
  const activeContracts = contracts.filter(c => c.status === "Active").length;

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="role-dashboard accounts-theme">
      <div className="role-header">
        <div className="role-header-left">
          <div className="role-avatar"><FaWallet /></div>
          <div>
            <h1>Accounts Manager</h1>
            <p>Welcome, {user?.name || "Accounts"}</p>
          </div>
        </div>
        <div className="role-header-actions">
          <button className="role-action-btn primary" onClick={() => navigate("/b2b/contracts")}><FaFileContract /> Contracts</button>
          <button className="role-action-btn secondary" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="role-stats">
        <div className="role-stat-card"><FaRupeeSign className="stat-icon" style={{color:"#10b981"}} /><div><div className="stat-val">₹{Math.round(revenue/1000)}k</div><div className="stat-lbl">Revenue Collected</div></div></div>
        <div className="role-stat-card"><FaChartBar className="stat-icon" style={{color:"#f59e0b"}} /><div><div className="stat-val">₹{Math.round(pending/1000)}k</div><div className="stat-lbl">Pending Payments</div></div></div>
        <div className="role-stat-card"><FaFileContract className="stat-icon" style={{color:"#2563eb"}} /><div><div className="stat-val">{activeContracts}</div><div className="stat-lbl">Active Contracts</div></div></div>
        <div className="role-stat-card"><FaCheckCircle className="stat-icon" style={{color:"#8b5cf6"}} /><div><div className="stat-val">{orders.filter(o=>o.status==="Delivered").length}</div><div className="stat-lbl">Invoices Cleared</div></div></div>
      </div>

      <div className="role-body">
        <div className="role-card">
          <h2>Active Contracts</h2>
          {loading ? <p>Loading...</p> : (
            <div className="role-table-wrap">
              <table className="role-table">
                <thead><tr><th>Customer</th><th>Type</th><th>Discount</th><th>End Date</th><th>Status</th></tr></thead>
                <tbody>
                  {contracts.slice(0,10).map(c => (
                    <tr key={c.contract_id || c.id}>
                      <td><strong>{c.customer_name}</strong></td>
                      <td>{c.contract_type}</td>
                      <td className="green-text">{c.discount_percentage || 0}%</td>
                      <td>{c.end_date ? c.end_date.split("T")[0] : "—"}</td>
                      <td><span className="role-status-pill" style={{background:c.status==="Active"?"#dcfce7":"#fef9c3",color:c.status==="Active"?"#15803d":"#854d0e"}}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="role-card-footer">
            <button className="role-link-btn" onClick={() => navigate("/b2b/contracts")}>All Contracts →</button>
          </div>
        </div>

        <div className="role-card">
          <h2>Recent Orders</h2>
          {loading ? <p>Loading...</p> : (
            <div className="role-table-wrap">
              <table className="role-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.slice(0,8).map(o => (
                    <tr key={o.order_id}>
                      <td>ORD{String(o.order_id).padStart(3,"0")}</td>
                      <td>{o.customer_name}</td>
                      <td>₹{o.amount?.toLocaleString("en-IN")}</td>
                      <td><span className="role-status-pill" style={{background:"#dbeafe",color:"#1d4ed8"}}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="role-card-footer">
            <button className="role-link-btn" onClick={() => navigate("/orders")}>All Orders →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountsDashboard;
