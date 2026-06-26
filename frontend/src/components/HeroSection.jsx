import { Link } from "react-router-dom";
import "./HeroSection.css";

function HeroSection() {
  return (
    <section className="hero">

      {/* Left Side */}
      <div className="hero-left">

        <h1>
          Smart Cleaning Kit <span>Package Builder</span>
        </h1>

        <p>
          Simplify cleaning supply management with ready-made
          packages for hotels, offices, hospitals, and schools.
          Manage orders, inventory, reports, and analytics from
          one powerful dashboard.
        </p>

        <div className="hero-buttons">
          <Link to="/kit-builder" className="primary-btn">
            Build Package
          </Link>

          <Link to="/dashboard" className="secondary-btn">
            View Dashboard
          </Link>
        </div>

        {/* Statistics */}
        <div className="hero-stats">

          <div className="stat-card">
            <h2>1000+</h2>
            <p>Products</p>
          </div>

          <div className="stat-card">
            <h2>500+</h2>
            <p>Customers</p>
          </div>

          <div className="stat-card">
            <h2>200+</h2>
            <p>Orders</p>
          </div>

          <div className="stat-card">
            <h2>₹5L+</h2>
            <p>Revenue</p>
          </div>

        </div>

      </div>

      {/* Right Side */}
      <div className="hero-right">

        <div className="dashboard-card">

          <h3>Dashboard Overview</h3>

          <div className="overview-card">
            <span>Total Orders</span>
            <h2>120</h2>
          </div>

          <div className="overview-card">
            <span>Revenue</span>
            <h2>₹5,00,000</h2>
          </div>

          <div className="overview-card">
            <span>Pending Orders</span>
            <h2>25</h2>
          </div>

          <div className="overview-card">
            <span>Completed Orders</span>
            <h2>95</h2>
          </div>

        </div>

      </div>

    </section>
  );
}

export default HeroSection;