import { useNavigate } from "react-router-dom";
import { FaUserShield, FaUserTie, FaHardHat, FaShoppingBag } from "react-icons/fa";
import "../../styles/rbac.css";

const ROLES = [
  {
    key: "admin",
    name: "Admin",
    desc: "Full system control. Single Super Admin account.",
    icon: <FaUserShield />,
    accent: "#a78bfa",
    path: "/admin/login",
  },
  {
    key: "manager",
    name: "Manager",
    desc: "Oversee inventory, orders, customers, and staff.",
    icon: <FaUserTie />,
    accent: "#2dd4bf",
    path: "/manager/login",
  },
  {
    key: "staff",
    name: "Staff",
    desc: "Handle daily orders and product operations.",
    icon: <FaHardHat />,
    accent: "#f5a524",
    path: "/staff/login",
  },
  {
    key: "customer",
    name: "Customer",
    desc: "Browse products, build kits, and place orders.",
    icon: <FaShoppingBag />,
    accent: "#60a5fa",
    path: "/",
  },
];

function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="ops-scope">
      <div className="ops-grid-bg" />
      <div className="ops-glow" style={{ background: "#a78bfa", top: "5%", left: "10%" }} />
      <div className="ops-glow" style={{ background: "#2dd4bf", bottom: "5%", right: "10%" }} />

      <div className="ops-center-shell">
        <div className="ops-brand-row">
          <div className="ops-brand-mark">CK</div>
          <span className="ops-brand-text">
            <strong>Cleaning Kit</strong> Ops Portal
          </span>
        </div>

        <h1 className="ops-welcome-title" style={{ textAlign: "center" }}>
          Who's signing in?
        </h1>
        <p className="ops-welcome-subtitle" style={{ textAlign: "center" }}>
          Select your role to continue. Customers can browse right away —
          no account needed.
        </p>

        <div className="ops-select-grid">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className="ops-role-card"
              onClick={() => navigate(r.path)}
            >
              <span
                className="ops-role-icon"
                style={{ background: `${r.accent}22`, color: r.accent }}
              >
                {r.icon}
              </span>
              <div className="ops-role-name">{r.name}</div>
              <div className="ops-role-desc">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
