import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatisticsCard from "../components/StatisticsCard";
import DashboardTable from "../components/DashboardTable";
import NotificationPanel from "../components/NotificationPanel";
import AlertCard from "../components/AlertCard";
import LoadingSpinner from "../components/LoadingSpinner";
import SmartInsights from "../components/SmartInsights";
import RecommendationFeed from "../components/RecommendationFeed";
import AlertHub from "../components/AlertHub";
import { getDashboardStats, getRecentOrders, getProducts, getInventory } from "../services/api";
import { generateClientSummary, generateClientRecommendations, generateClientAlerts } from "../services/aiService";

import {
  FaShoppingCart,
  FaUsers,
  FaBoxes,
  FaRupeeSign,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaFire,
} from "react-icons/fa";

import "./Dashboard.css";

const MONTHLY_GOAL = 100000;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    lowStockProducts: 0,
  });
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [savedKits, setSavedKits] = useState([]);
  const [expandedKitId, setExpandedKitId] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [statsRes, ordersRes] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(),
        ]);
        
        setStats(statsRes.data);

        // Fetch products & inventory for AI fallback data
        try {
          const [pRes, iRes] = await Promise.all([
            getProducts({ limit: 100 }),
            getInventory({ limit: 100 }),
          ]);
          setProducts(pRes.data.products || []);
          setInventory(iRes.data.inventory || []);
        } catch { /* non-critical */ }

        // Map backend orders (snake_case or camelCase) to what DashboardTable expects
        const mappedOrders = ordersRes.data.map(o => ({
          id: `ORD${String(o.order_id).padStart(3, '0')}`,
          customer: o.customer_name || 'Guest',
          packageName: o.package_name || 'Custom Package',
          quantity: o.quantity || 1,
          amount: parseFloat(o.amount || 0),
          status: o.status || 'Pending',
        }));
        setOrders(mappedOrders);

        // Fetch notifications (Mock/System generated based on low stock / pending orders)
        const systemNotifs = [];
        if (statsRes.data.lowStockProducts > 0) {
          systemNotifs.push({
            id: 1,
            title: "Low Stock Alert",
            message: `${statsRes.data.lowStockProducts} products are running below minimum stock.`,
            time: "Just now",
            type: "warning",
          });
        }
        if (statsRes.data.pendingOrders > 0) {
          systemNotifs.push({
            id: 2,
            title: "Pending Orders",
            message: `There are ${statsRes.data.pendingOrders} orders waiting for processing.`,
            time: "Just now",
            type: "info",
          });
        }
        systemNotifs.push({
          id: 3,
          title: "System Online",
          message: "Cleaning Kit API database successfully connected.",
          time: "1 hour ago",
          type: "success",
        });
        setNotifications(systemNotifs);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    // Load saved kits from localStorage
    const kits = JSON.parse(localStorage.getItem("savedKits") || "[]");
    setSavedKits(kits);
  }, []);

  const handleDeleteKit = (kitId, e) => {
    if (e) e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this saved kit?")) return;
    const kits = JSON.parse(localStorage.getItem("savedKits") || "[]");
    const updated = kits.filter(k => k.id !== kitId);
    localStorage.setItem("savedKits", JSON.stringify(updated));
    setSavedKits(updated);
    if (expandedKitId === kitId) {
      setExpandedKitId(null);
    }
  };

  const toggleExpandKit = (kitId, e) => {
    if (e) e.preventDefault();
    setExpandedKitId(expandedKitId === kitId ? null : kitId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Format currency in Indian Rupees style
  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to Cleaning Kit Package Builder</p>
      </div>

      {/* Step 4: AI / Rule-Based Insights */}
      <div className="dashboard-ai-section">
        <SmartInsights
          fallbackData={{
            daily: generateClientSummary(orders, products, inventory),
            orders: { summary: `${stats.totalOrders} total orders, ${stats.pendingOrders} pending` },
          }}
        />
      </div>

      {/* Statistics Cards */}
      <div className="statistics-grid">
        <StatisticsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<FaShoppingCart />}
          color="#2563eb"
          percentage=""
          subtitle="Total order volume"
        />

        <StatisticsCard
          title="Customers"
          value={stats.totalCustomers}
          icon={<FaUsers />}
          color="#10b981"
          percentage=""
          subtitle="Registered clients"
        />

        <StatisticsCard
          title="Products"
          value={stats.totalProducts}
          icon={<FaBoxes />}
          color="#f59e0b"
          percentage=""
          subtitle="Available products"
        />

        <StatisticsCard
          title="Revenue"
          value={formatRupee(stats.totalRevenue)}
          icon={<FaRupeeSign />}
          color="#ef4444"
          percentage=""
          subtitle="Earnings from completed orders"
        />
      </div>

      {/* Revenue Goal Goal Bar */}
      <div className="dashboard-section revenue-goal-section">
        <h2><FaFire style={{ color: "#f59e0b" }} /> Monthly Revenue Goal</h2>
        <div className="revenue-goal-wrapper">
          <div className="revenue-goal-labels">
            <span className="revenue-current">{formatRupee(stats.totalRevenue)}</span>
            <span className="revenue-target">Goal: {formatRupee(MONTHLY_GOAL)}</span>
          </div>
          <div className="revenue-goal-track">
            <div
              className="revenue-goal-fill"
              style={{
                width: `${Math.min((stats.totalRevenue / MONTHLY_GOAL) * 100, 100)}%`,
                background: stats.totalRevenue >= MONTHLY_GOAL
                  ? "#10b981"
                  : stats.totalRevenue >= MONTHLY_GOAL * 0.6
                  ? "#f59e0b"
                  : "#6366f1",
              }}
            />
          </div>
          <div className="revenue-goal-footer">
            <span className="revenue-pct">
              {Math.round((stats.totalRevenue / MONTHLY_GOAL) * 100)}% of monthly target
            </span>
            {stats.totalRevenue >= MONTHLY_GOAL ? (
              <span className="revenue-badge achieved">Goal Achieved!</span>
            ) : (
              <span className="revenue-badge pending-goal">
                {formatRupee(MONTHLY_GOAL - stats.totalRevenue)} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Smart Alerts Panel */}
      <div className="dashboard-smart-alerts">
        <h2 className="smart-alerts-title">Smart Alerts</h2>
        <div className="smart-alerts-grid">
          {stats.lowStockProducts > 0 ? (
            <Link to="/inventory" className="smart-alert-card warning" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
              <FaExclamationTriangle className="sa-icon" />
              <div>
                <strong>{stats.lowStockProducts} Low Stock Items</strong>
                <p>Products below minimum level — reorder now</p>
              </div>
            </Link>
          ) : (
            <div className="smart-alert-card success">
              <FaCheckCircle className="sa-icon" />
              <div>
                <strong>Stock Healthy</strong>
                <p>All products are above minimum stock levels</p>
              </div>
            </div>
          )}

          {stats.pendingOrders > 0 ? (
            <div className="smart-alert-card info">
              <FaInfoCircle className="sa-icon" />
              <div>
                <strong>{stats.pendingOrders} Pending Orders</strong>
                <p>Awaiting processing — action required</p>
              </div>
            </div>
          ) : (
            <div className="smart-alert-card success">
              <FaCheckCircle className="sa-icon" />
              <div>
                <strong>No Pending Orders</strong>
                <p>All orders are up to date</p>
              </div>
            </div>
          )}

          {stats.processingOrders > 0 && (
            <div className="smart-alert-card info">
              <FaShoppingCart className="sa-icon" />
              <div>
                <strong>{stats.processingOrders} Orders Processing</strong>
                <p>Currently being packed or shipped</p>
              </div>
            </div>
          )}

          <div className="smart-alert-card success">
            <FaCheckCircle className="sa-icon" />
            <div>
              <strong>System Online</strong>
              <p>All services running normally</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Saved Kits Section */}
      <div className="dashboard-section saved-kits-section" style={{ marginTop: "30px", marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "24px" }}>My Saved Kits</h2>
        
        {savedKits.length === 0 ? (
          <div className="empty-state-kitscard" style={{ padding: "40px", background: "white", borderRadius: "16px", border: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ fontSize: "3rem" }}>📦</span>
            <h3 style={{ margin: "12px 0 6px" }}>No kits saved yet</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>Build your first kit in the Package Builder to see it here!</p>
            <a href="/kit-builder" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", padding: "10px 20px", borderRadius: "8px", background: "var(--primary)", color: "white", fontWeight: "600" }}>
              Build Your First Kit
            </a>
          </div>
        ) : (
          <div className="saved-kits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {savedKits.map((kit) => {
              const dateString = new Date(kit.timestamp).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              
              const isExpanded = expandedKitId === kit.id;
              
              const useCaseBadges = {
                hotel: { name: "Hotel Cleaning Kit", color: "#2563eb", bg: "#dbeafe" },
                office: { name: "Office Cleaning Kit", color: "#10b981", bg: "#d1fae5" },
                hospital: { name: "Hospital Hygiene Kit", color: "#ef4444", bg: "#fee2e2" },
                school: { name: "School Cleaning Kit", color: "#f59e0b", bg: "#fef3c7" },
                custom: { name: "Custom Cleaning Kit", color: "#6366f1", bg: "#eef2ff" }
              };
              
              const badge = useCaseBadges[kit.useCase] || useCaseBadges.custom;

              return (
                <div key={kit.id} className="saved-kit-card card glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{kit.name}</h3>
                    <span 
                      style={{ 
                        background: badge.bg, 
                        color: badge.color, 
                        padding: "4px 10px", 
                        borderRadius: "20px", 
                        fontSize: "0.75rem", 
                        fontWeight: 700 
                      }}
                    >
                      {badge.name}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    <span>Grand Total: <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>₹{Math.round(kit.grandTotal)}</strong></span>
                    <span>Saved: {dateString}</span>
                  </div>
                  
                  <div className="kit-card-actions" style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button 
                      onClick={(e) => toggleExpandKit(kit.id, e)} 
                      className="btn-secondary"
                      style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", border: "1px solid var(--border)", background: "transparent", borderRadius: "8px", cursor: "pointer" }}
                    >
                      {isExpanded ? "Hide Details" : "View Details"}
                    </button>
                    <button 
                      onClick={(e) => handleDeleteKit(kit.id, e)} 
                      className="btn-danger"
                      style={{ 
                        padding: "8px 12px", 
                        fontSize: "0.85rem", 
                        background: "var(--danger-color, #ef4444)", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="kit-expanded-details" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "8px" }}>
                      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-secondary)" }}>
                            <th style={{ paddingBottom: "6px" }}>Product</th>
                            <th style={{ paddingBottom: "6px", textAlign: "center" }}>Qty</th>
                            <th style={{ paddingBottom: "6px", textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kit.items.map(item => (
                            <tr key={item.product_id} style={{ borderBottom: "1px dotted var(--border)" }}>
                              <td style={{ padding: "6px 0" }}>{item.name}</td>
                              <td style={{ padding: "6px 0", textAlign: "center" }}>{item.quantity}</td>
                              <td style={{ padding: "6px 0", textAlign: "right" }}>₹{item.price * item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="dashboard-section">
        <h2>Recent Orders</h2>
        <DashboardTable orders={orders} />
      </div>

      {/* Step 4: AI Recommendations & Alerts */}
      <div className="dashboard-ai-row">
        <div className="dashboard-ai-col">
          <RecommendationFeed products={products} inventory={inventory} />
        </div>
        <div className="dashboard-ai-col">
          <AlertHub orders={orders} inventory={inventory} />
        </div>
      </div>

      {/* Notifications */}
      <div className="dashboard-section">
        <h2>System Alerts</h2>
        <NotificationPanel notifications={notifications} />
      </div>
    </div>
  );
}

export default Dashboard;