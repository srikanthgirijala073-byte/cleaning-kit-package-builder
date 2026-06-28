import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Company Section */}
        <div className="footer-section">
          <h2>🧹 Ganga Maxx</h2>

          <p>
            Smart B2B cleaning supply management platform
            for hotels, offices, hospitals, and schools.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>

          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/kit-builder">Kit Builder</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/orders">Orders</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div className="footer-section">
          <h3>Services</h3>

          <ul>
            <li><Link to="/kit-builder">Cleaning Kits</Link></li>
            <li><Link to="/inventory">Inventory Management</Link></li>
            <li><Link to="/b2b/delivery-tracker">Order Tracking</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3>Contact Us</h3>

          <p>📍 Hyderabad, India</p>
          <p>📞 +91 98765 43210</p>
          <p>✉️ support@cleaningkitbuilder.com</p>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <p>
          © 2026 Cleaning Kit Builder. All Rights Reserved.
        </p>
      </div>

    </footer>
  );
}

export default Footer;