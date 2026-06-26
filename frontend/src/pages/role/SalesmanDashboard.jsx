import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaUserTie, FaCalendarCheck, FaBell, FaMapMarkerAlt, FaPhoneAlt, FaChartLine, FaSignOutAlt } from "react-icons/fa";
import "./RoleDashboard.css";

const MOCK_VISITS = [
  { id:1, customer_name:"Apollo Hospital",   company:"Apollo Group",  visit_date:"2026-06-18", visit_type:"Follow-up",    outcome:"Positive", follow_up_date:"2026-06-25", notes:"Interested in annual contract" },
  { id:2, customer_name:"Taj Hotel",          company:"Taj Group",     visit_date:"2026-06-20", visit_type:"Demo",         outcome:"Pending",  follow_up_date:"2026-06-28", notes:"Showed new sanitizer range" },
  { id:3, customer_name:"TCS Office",         company:"TCS Ltd",       visit_date:"2026-06-21", visit_type:"Introductory", outcome:"Positive", follow_up_date:"2026-06-30", notes:"Needs corporate cleaning kit" },
];

const MOCK_FOLLOWUPS = [
  { id:1, customer:"Apollo Hospital", date:"2026-06-25", priority:"High" },
  { id:2, customer:"Taj Hotel",       date:"2026-06-28", priority:"Medium" },
  { id:3, customer:"TCS Office",      date:"2026-06-30", priority:"Low" },
];

function SalesmanDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats] = useState({ totalVisits: 12, positiveOutcomes: 9, pendingFollowups: 3, conversions: 4 });

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="role-dashboard salesman-theme">
      <div className="role-header">
        <div className="role-header-left">
          <div className="role-avatar"><FaUserTie /></div>
          <div>
            <h1>Salesman Portal</h1>
            <p>Welcome back, {user?.name || "Salesman"}</p>
          </div>
        </div>
        <div className="role-header-actions">
          <button className="role-action-btn primary" onClick={() => navigate("/b2b/visits")}><FaCalendarCheck /> Log Visit</button>
          <button className="role-action-btn secondary" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        </div>
      </div>

      <div className="role-stats">
        <div className="role-stat-card">
          <FaMapMarkerAlt className="stat-icon" style={{ color:"#2563eb" }} />
          <div><div className="stat-val">{stats.totalVisits}</div><div className="stat-lbl">Total Visits</div></div>
        </div>
        <div className="role-stat-card">
          <FaChartLine className="stat-icon" style={{ color:"#10b981" }} />
          <div><div className="stat-val">{stats.positiveOutcomes}</div><div className="stat-lbl">Positive Outcomes</div></div>
        </div>
        <div className="role-stat-card">
          <FaBell className="stat-icon" style={{ color:"#f59e0b" }} />
          <div><div className="stat-val">{stats.pendingFollowups}</div><div className="stat-lbl">Pending Follow-ups</div></div>
        </div>
        <div className="role-stat-card">
          <FaPhoneAlt className="stat-icon" style={{ color:"#8b5cf6" }} />
          <div><div className="stat-val">{stats.conversions}</div><div className="stat-lbl">Conversions</div></div>
        </div>
      </div>

      <div className="role-body">
        <div className="role-card">
          <h2>Recent Visits</h2>
          <div className="role-table-wrap">
            <table className="role-table">
              <thead><tr><th>Customer</th><th>Visit Type</th><th>Date</th><th>Outcome</th><th>Follow-up</th></tr></thead>
              <tbody>
                {MOCK_VISITS.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.customer_name}</strong><br /><small>{v.company}</small></td>
                    <td>{v.visit_type}</td>
                    <td>{v.visit_date}</td>
                    <td><span className={`outcome-pill ${v.outcome === "Positive" ? "positive" : "pending"}`}>{v.outcome}</span></td>
                    <td>{v.follow_up_date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="role-card-footer">
            <button className="role-link-btn" onClick={() => navigate("/b2b/visits")}>View All Visits →</button>
          </div>
        </div>

        <div className="role-card">
          <h2>Upcoming Follow-ups</h2>
          <div className="followup-list">
            {MOCK_FOLLOWUPS.map(f => (
              <div key={f.id} className="followup-item">
                <FaBell className={`fu-icon ${f.priority.toLowerCase()}`} />
                <div className="fu-info">
                  <strong>{f.customer}</strong>
                  <span>{f.date}</span>
                </div>
                <span className={`priority-pill ${f.priority.toLowerCase()}`}>{f.priority}</span>
              </div>
            ))}
          </div>
          <div className="role-card-footer">
            <button className="role-link-btn" onClick={() => navigate("/b2b/visits")}>Manage Follow-ups →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesmanDashboard;
