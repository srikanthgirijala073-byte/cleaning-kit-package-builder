import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Company Section */}
        <div className="footer-section">
          <h2>🧹 Cleaning Kit Builder</h2>

          <p>
            Smart B2B cleaning supply management platform
            for hotels, offices, hospitals, and schools.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>

          <ul>
            <li>Home</li>
            <li>Dashboard</li>
            <li>Kit Builder</li>
            <li>Products</li>
            <li>Orders</li>
          </ul>
        </div>

        {/* Services */}
        <div className="footer-section">
          <h3>Services</h3>

          <ul>
            <li>Cleaning Kits</li>
            <li>Inventory Management</li>
            <li>Order Tracking</li>
            <li>Reports</li>
            <li>Analytics</li>
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