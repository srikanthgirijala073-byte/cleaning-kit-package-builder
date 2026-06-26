import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAiRecommendations, generateClientRecommendations } from "../services/aiService";
import { FaLightbulb, FaBoxes, FaExclamationTriangle, FaStar, FaShoppingCart } from "react-icons/fa";
import "./RecommendationFeed.css";

function RecommendationFeed({ products, inventory }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await getAiRecommendations();
      const data = res.data;
      const items = [];

      if (data?.reorder?.items) {
        data.reorder.items.forEach((item) => {
          items.push({
            type: "reorder",
            priority: item.priority || "warning",
            title: `Reorder: ${item.name}`,
            message: `Stock: ${item.current_stock} (min: ${item.minimum_stock})`,
            link: "/inventory",
            linkLabel: "Restock",
            product: item,
          });
        });
      }

      if (data?.popular?.items) {
        data.popular.items.forEach((item) => {
          items.push({
            type: "popular",
            priority: "info",
            title: `Popular: ${item.name}`,
            message: `⭐ ${item.rating || "N/A"} · ${item.total_ordered || 0} ordered`,
            link: "/products",
            linkLabel: "View",
            product: item,
          });
        });
      }

      if (items.length === 0 && products && inventory) {
        // Use client-side fallback
        const fallback = generateClientRecommendations(products, inventory);
        fallback.forEach((r) => {
          items.push({
            type: r.type,
            priority: r.priority,
            title: r.title,
            message: r.message,
            link: r.type === "reorder" ? "/inventory" : "/products",
            linkLabel: r.type === "reorder" ? "Restock" : "View",
          });
        });
      }

      setRecommendations(items);
    } catch {
      // Client-side fallback
      if (products && inventory) {
        const fallback = generateClientRecommendations(products, inventory);
        setRecommendations(
          fallback.map((r) => ({
            type: r.type,
            priority: r.priority,
            title: r.title,
            message: r.message,
            link: r.type === "reorder" ? "/inventory" : "/products",
            linkLabel: r.type === "reorder" ? "Restock" : "View",
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    activeFilter === "all"
      ? recommendations
      : recommendations.filter((r) => r.type === activeFilter);

  const reorderCount = recommendations.filter((r) => r.type === "reorder").length;
  const popularCount = recommendations.filter((r) => r.type === "popular").length;

  if (loading) {
    return (
      <div className="rec-feed">
        <div className="rec-header">
          <h3><FaLightbulb /> AI Recommendations</h3>
        </div>
        <div className="rec-loading">Analyzing data...</div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="rec-feed">
      <div className="rec-header">
        <h3><FaLightbulb /> AI Recommendations</h3>
        <span className="rec-count">{recommendations.length} items</span>
      </div>

      <div className="rec-filters">
        <button
          className={`rec-filter-btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
          type="button"
        >
          All ({recommendations.length})
        </button>
        <button
          className={`rec-filter-btn ${activeFilter === "reorder" ? "active" : ""}`}
          onClick={() => setActiveFilter("reorder")}
          type="button"
        >
          <FaExclamationTriangle /> Reorder ({reorderCount})
        </button>
        <button
          className={`rec-filter-btn ${activeFilter === "popular" ? "active" : ""}`}
          onClick={() => setActiveFilter("popular")}
          type="button"
        >
          <FaStar /> Popular ({popularCount})
        </button>
      </div>

      <div className="rec-list">
        {filtered.map((rec, idx) => (
          <div
            key={idx}
            className={`rec-item rec-${rec.priority} ${rec.type === "popular" ? "rec-popular" : ""}`}
          >
            <div className="rec-icon">
              {rec.type === "reorder" ? <FaExclamationTriangle /> : <FaStar />}
            </div>
            <div className="rec-content">
              <div className="rec-title">{rec.title}</div>
              <div className="rec-message">{rec.message}</div>
            </div>
            {rec.link && (
              <Link to={rec.link} className="rec-action">
                {rec.linkLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendationFeed;
