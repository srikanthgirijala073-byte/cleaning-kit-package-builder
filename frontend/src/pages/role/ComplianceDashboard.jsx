import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getComplianceRecords } from "../../services/api";
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaClock, FaClipboardList, FaSignOutAlt } from "react-icons/fa";
import "./RoleDashboard.css";

function ComplianceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplianceRecords({}).then(r => setRecords(r.data.records || r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const open = records.filter(r => r.status === "Open").length;
  const inProgress = records.filter(r => r.status === "In Progress").length;
  const resolved = records.filter(r => r.status === "Resolved" || r.status === "Closed").length;
  const critical = records.filter(r => r.severity === "Critical" || r.severity === "High").length;

  const sevColor = (s) => ({ Critical:"#dc2626", High:"#d97706", Medium:"#2563eb", Low:"#10b981" }[s] || "#64748b");

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="role-dashboard compliance-theme">
      <div className="role-header">
        <div className="role-header-left">
          <div className="role-avatar"><FaShieldAlt /></div>
          <div>
            <h1>Compliance Admin</h1>
            <p>Welcome, {user?.name || "Compliance Admin"}</p>
          </div>
        </div>
        <div className="role-header-actions">
          <button className="role-action-btn primary" onClick={() => navigate("/b2b/compliance")}><FaClipboardList /> Compliance Portal</button>
          <button className="role-action-btn secondary" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="role-stats">
        <div className="role-stat-card"><FaExclamationTriangle className="stat-icon" style={{color:"#ef4444"}} /><div><div className="stat-val">{critical}</div><div className="stat-lbl">Critical/High Issues</div></div></div>
        <div className="role-stat-card"><FaClock className="stat-icon" style={{color:"#f59e0b"}} /><div><div className="stat-val">{open}</div><div className="stat-lbl">Open Issues</div></div></div>
        <div className="role-stat-card"><FaClipboardList className="stat-icon" style={{color:"#2563eb"}} /><div><div className="stat-val">{inProgress}</div><div className="stat-lbl">In Progress</div></div></div>
        <div className="role-stat-card"><FaCheckCircle className="stat-icon" style={{color:"#10b981"}} /><div><div className="stat-val">{resolved}</div><div className="stat-lbl">Resolved</div></div></div>
      </div>

      <div className="role-card">
        <h2>Compliance Records</h2>
        {loading ? <p>Loading...</p> : records.length === 0 ? (
          <p style={{color:"#94a3b8",padding:"20px"}}>No compliance records found.</p>
        ) : (
          <div className="role-table-wrap">
            <table className="role-table">
              <thead><tr><th>Customer</th><th>Type</th><th>Severity</th><th>Target Date</th><th>Status</th><th>Findings</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.customer_name}</strong></td>
                    <td>{r.compliance_type}</td>
                    <td><span className="role-status-pill" style={{background:sevColor(r.severity)+"22",color:sevColor(r.severity)}}>{r.severity}</span></td>
                    <td>{r.target_date || "—"}</td>
                    <td><span className="role-status-pill" style={{background:r.status==="Resolved"?"#dcfce7":r.status==="Open"?"#fee2e2":"#fef9c3",color:r.status==="Resolved"?"#15803d":r.status==="Open"?"#dc2626":"#854d0e"}}>{r.status}</span></td>
                    <td style={{maxWidth:"200px",fontSize:"12px",color:"#64748b"}}>{r.findings || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="role-card-footer">
          <button className="role-link-btn" onClick={() => navigate("/b2b/compliance")}>Full Compliance Portal →</button>
        </div>
      </div>
    </div>
  );
}

export default ComplianceDashboard;
