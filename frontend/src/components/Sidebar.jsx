import { Link, useLocation } from "react-router-dom";
import { BACKEND_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SIDEBAR_MENU_ITEMS } from "../utils/roles";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const authData = useAuth();
  const { user, isAuthenticated } = authData || {};
  const location = useLocation();

  // Filter menu items based on user role
  const userRole = user?.role || "customer";
  const visibleMenuItems = SIDEBAR_MENU_ITEMS.filter((item) => {
    if (item.roles === "*") return true;
    return item.roles.includes(userRole);
  });

  if (!isAuthenticated) return null;

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>

      {/* Logo Section */}
      <div className="sidebar-top">
        <div className="logo">
          <h2>🧹 Cleaning Kit Builder</h2>
        </div>

        {/* Navigation Links */}
        <ul className="sidebar-menu">
          {visibleMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onClose}
                className={
                  location.pathname === item.path
                    ? "menu-link active-link"
                    : "menu-link"
                }
              >
                <span className="icon">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        <div className="admin-card">
          <div className="admin-image">
            {user?.profile_image ? (
              <img
                src={`${BACKEND_URL}${user.profile_image}`}
                alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              "👤"
            )}
          </div>

          <div className="admin-details">
            <h4>{user?.name || "User"}</h4>
            <p>{user?.role ? user.role.toUpperCase() : "CUSTOMER"}</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Sidebar;