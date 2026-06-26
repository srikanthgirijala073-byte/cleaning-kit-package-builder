import { FaBox, FaChartLine, FaBell, FaUsers, FaShieldAlt, FaHeadset } from 'react-icons/fa';

const features = [
  { icon: <FaBox />, title: 'Kit Builder', description: 'Build custom cleaning packages with an intuitive drag-and-drop interface.' },
  { icon: <FaChartLine />, title: 'Analytics Dashboard', description: 'Real-time insights into revenue, orders, and inventory performance.' },
  { icon: <FaBell />, title: 'Smart Notifications', description: 'Get alerts for low stock, new orders, and payment updates instantly.' },
  { icon: <FaUsers />, title: 'Customer Management', description: 'Manage customer profiles, order history, and preferences in one place.' },
  { icon: <FaShieldAlt />, title: 'Inventory Control', description: 'Track stock levels, set reorder points, and prevent stockouts.' },
  { icon: <FaHeadset />, title: '24/7 Support', description: 'Dedicated support team available around the clock for your business.' },
];

function FeatureSection() {
  return (
    <section className="features-section">
      <div className="features-header">
        <span className="features-badge">Features</span>
        <h2>Everything You Need to Manage Cleaning Kits</h2>
        <p>Powerful tools to streamline your cleaning supply management workflow</p>
      </div>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card glass">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureSection;
