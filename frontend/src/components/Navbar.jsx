import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/api";
import "./Navbar.css";

function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnreadCount = async () => {
      try {
        const res = await getNotifications();
        if (res && Array.isArray(res.data)) {
          const count = res.data.filter(n => !n.is_read).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Error loading notification count:", err);
      }
    };
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const userRole = user?.role || "customer";
  
  const navLinks = [
    { path: "/dashboard", label: "Dashboard", roles: "*" },
    { path: "/kit-builder", label: "Kit Builder", roles: ["customer", "staff", "manager", "admin"] },
    { path: "/products", label: "Products", roles: ["staff", "manager", "admin"] },
    { path: "/orders", label: "Orders", roles: ["staff", "manager", "admin"] },
  ].filter(link => link.roles === "*" || link.roles.includes(userRole));

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      {/* Left side: Mobile Toggle & Logo */}
      <div className="navbar-left">
        {isAuthenticated && (
          <button className="menu-toggle" onClick={onToggleSidebar} type="button" aria-label="Toggle menu">
            ☰
          </button>
        )}
        <Link to="/" className="navbar-brand">
          <span style={{ fontSize: "1.4rem" }}>🧹</span>
          <span className="navbar-logo-text">Ganga Maxx</span>
        </Link>
      </div>

      {/* Center Section: Nav Links */}
      {isAuthenticated && (
        <div className="navbar-center">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Right Section: Utilities */}
      <div className="navbar-right">
        {isAuthenticated && (
          <Link to="/notifications" className="nav-bell-btn" style={{ position: "relative", marginRight: "0.75rem", display: "inline-flex", alignItems: "center", textDecoration: "none" }} aria-label="Notifications">
            <span style={{ fontSize: "1.25rem" }}>🔔</span>
            {unreadCount > 0 && (
              <span className="badge" style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "#ffffff", borderRadius: "50%", minWidth: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "bold", padding: "2px" }}>
                {unreadCount}
              </span>
            )}
          </Link>
        )}
        {isAuthenticated && (
          <Link to="/kit-builder" className="cta-btn">
            Get Quote
          </Link>
        )}
        {isAuthenticated && (
          <Link to="/profile" className="profile-btn">
            👤 Profile
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;