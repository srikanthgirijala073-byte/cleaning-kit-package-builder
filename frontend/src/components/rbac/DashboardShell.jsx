import { useNavigate } from "react-router-dom";
import { useRbacAuth } from "../../context/RbacAuthContext";
import "../../styles/rbac.css";

function DashboardShell({ roleLabel, accent, icon, children }) {
  const navigate = useNavigate();
  const { rbacUser, logoutRbac } = useRbacAuth();

  return (
    <div className="ops-scope" style={{ "--ops-focus": accent }}>
      <div className="ops-grid-bg" />
      <div className="ops-glow" style={{ background: accent, top: "-10%", right: "10%" }} />

      <div className="ops-dash-topbar">
        <div className="ops-keycard" style={{ marginBottom: 0 }}>
          <span className="ops-keycard-icon" style={{ background: `${accent}22`, color: accent }}>
            {icon}
          </span>
          <span className="ops-mono ops-keycard-label" style={{ color: accent }}>
            {roleLabel} Console
          </span>
          <span className="ops-keycard-strip" style={{ background: accent }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {rbacUser?.email && (
            <span className="ops-mono" style={{ fontSize: "12.5px", color: "var(--ops-text-muted)" }}>
              {rbacUser.email}
            </span>
          )}
          <button className="ops-logout-btn" onClick={() => logoutRbac(navigate)}>
            Log out
          </button>
        </div>
      </div>

      <div className="ops-dash-body">{children}</div>
    </div>
  );
}

export default DashboardShell;
