import { useEffect, useState } from "react";
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
  }, []);

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

      {/* Revenue Goal Bar */}
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
            <div className="smart-alert-card warning">
              <FaExclamationTriangle className="sa-icon" />
              <div>
                <strong>{stats.lowStockProducts} Low Stock Items</strong>
                <p>Products below minimum level — reorder now</p>
              </div>
            </div>
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