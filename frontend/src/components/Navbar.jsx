import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const getPageTitle = (path) => {
    if (path === "/") return "Welcome Home";
    if (path === "/dashboard") return "Dashboard Analytics";
    if (path === "/kit-builder") return "Package Kit Builder";
    if (path === "/orders") return "Orders Management";
    if (path === "/products") return "Products Catalog";
    if (path === "/inventory") return "Inventory Stock Logs";
    if (path === "/customers") return "Customers Registry";
    if (path === "/reports") return "Financial Reports";
    if (path === "/analytics") return "Deep Analytics";
    if (path === "/history") return "System History";
    if (path === "/notifications") return "System Notifications";
    if (path === "/settings") return "General Settings";
    if (path === "/profile") return "User Profile & Security";
    if (path === "/security-settings") return "Security & 2FA Credentials";
    if (path === "/login-history") return "Personal Login History";
    if (path.startsWith("/details/")) return "Order Details Panel";
    if (path === "/b2b/quotations") return "Quotation Builder";
    if (path === "/b2b/delivery-tracker") return "Delivery Tracker";
    if (path === "/b2b/visits") return "Salesman Visit Form";
    if (path === "/b2b/reorders") return "Reorder Dashboard";
    if (path === "/b2b/contracts") return "Contract Pricing";
    if (path === "/b2b/compliance") return "Compliance Portal";
    return "Cleaning Kit Builder";
  };

  return (
    <nav className="navbar">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="navbar-left">
        {isAuthenticated ? (
          <>
            <button className="menu-toggle" onClick={onToggleSidebar} type="button" aria-label="Toggle menu">
              ☰
            </button>
            <h2 className="navbar-title">{getPageTitle(location.pathname)}</h2>
          </>
        ) : (
          <h2 className="navbar-title">Cleaning Kit Builder</h2>
        )}
      </div>

      {/* Right Section: Utilities */}
      <div className="navbar-right">
        <button className="search-btn" type="button">
          🔍 Search
        </button>
        <Link to="/profile" className="profile-btn">
          👤 Profile
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;