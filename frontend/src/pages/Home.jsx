import { useState, useEffect } from "react";
import HeroSection from "../components/HeroSection";
import StatisticsCard from "../components/StatisticsCard";
import AlertCard from "../components/AlertCard";
import NotificationPanel from "../components/NotificationPanel";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { getDashboardStats } from "../services/api";

import {
  FaShoppingCart,
  FaUsers,
  FaBoxes,
  FaRupeeSign,
} from "react-icons/fa";

import "./Home.css";

function Home() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        if (res && res.data) {
          setStats({
            totalOrders: res.data.totalOrders || 0,
            totalCustomers: res.data.totalCustomers || 0,
            totalProducts: res.data.totalProducts || 0,
            totalRevenue: res.data.totalRevenue || 0,
          });
        }
      })
      .catch(() => {
        // Silent fail — show zeros if API is down
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const notifications = [
    {
      id: 1,
      title: "New Order Received",
      message: "Hotel Paradise ordered Premium Cleaning Kit.",
      time: "5 mins ago",
      type: "success",
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "Floor Cleaner stock is below minimum level.",
      time: "20 mins ago",
      type: "warning",
    },
    {
      id: 3,
      title: "Monthly Report Generated",
      message: "Sales report for June is ready.",
      time: "1 hour ago",
      type: "info",
    },
  ];

  const fmt = (num) =>
    statsLoading ? "..." : Number(num).toLocaleString("en-IN");

  const fmtRevenue = (num) =>
    statsLoading ? "..." : `₹${Number(num).toLocaleString("en-IN")}`;

  return (
    <>
      <div className="home-page">

        {/* Hero Section */}
        <HeroSection />

        {/* Statistics Section */}
        <section className="stats-section">

          <h2>Business Overview</h2>

          <div className="stats-grid">

            <StatisticsCard
              title="Total Orders"
              value={fmt(stats.totalOrders)}
              icon={<FaShoppingCart />}
              color="#2563eb"
              percentage="+12%"
              subtitle="Compared to last month"
            />

            <StatisticsCard
              title="Customers"
              value={fmt(stats.totalCustomers)}
              icon={<FaUsers />}
              color="#10b981"
              percentage="+8%"
              subtitle="Active customers"
            />

            <StatisticsCard
              title="Products"
              value={fmt(stats.totalProducts)}
              icon={<FaBoxes />}
              color="#f59e0b"
              percentage="+5%"
              subtitle="Available products"
            />

            <StatisticsCard
              title="Revenue"
              value={fmtRevenue(stats.totalRevenue)}
              icon={<FaRupeeSign />}
              color="#ef4444"
              percentage="+15%"
              subtitle="Monthly earnings"
            />

          </div>

        </section>

        {/* Alerts */}
        <section className="alerts-section">

          <h2>Important Alerts</h2>

          <AlertCard
            title="Low Stock Warning"
            message="Surface Cleaner stock is running low."
            type="warning"
          />

          <AlertCard
            title="Order Delivered"
            message="Premium Cleaning Kit delivered successfully."
            type="success"
          />

        </section>

        {/* Notifications */}
        <section className="notifications-section">

          <NotificationPanel notifications={notifications} />

        </section>

      </div>

      <Footer />
    </>
  );
}

export default Home;
