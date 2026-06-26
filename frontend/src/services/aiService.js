/**
 * AI / Rules Intelligence Service
 * Provides recommendations, summaries, alerts, and messages
 */
import API from "./api";

// =======================
// AI Insights (API calls)
// =======================
export const getAiInsights = () => API.get("/ai/insights");
export const getAiAlerts = () => API.get("/ai/alerts");
export const getAiRecommendations = () => API.get("/ai/recommendations");
export const getAiSummary = () => API.get("/ai/summary");
export const getAiMessages = () => API.get("/ai/messages");

// =======================
// Client-side Rule Engine
// =======================

export const generateClientRecommendations = (products, inventory) => {
  const recommendations = [];
  if (!products || !inventory) return recommendations;

  const lowStock = (inventory || []).filter((i) => {
    return Number(i.current_stock) <= Number(i.minimum_stock) * 1.5;
  });

  lowStock.forEach((item) => {
    const product = (products || []).find((p) => p.product_id === item.product_id);
    if (product) {
      const msg =
        "Current stock (" +
        item.current_stock +
        ") is below threshold (" +
        item.minimum_stock +
        ").";
      recommendations.push({
        type: "reorder",
        priority:
          Number(item.current_stock) <= Number(item.minimum_stock)
            ? "critical"
            : "warning",
        title: "Reorder: " + product.name,
        message: msg,
        product: product,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
      });
    }
  });

  const sorted = [...(products || [])].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0)
  );

  sorted.slice(0, 5).forEach((product) => {
    recommendations.push({
      type: "popular",
      priority: "info",
      title: "Popular: " + product.name,
      message:
        "Rating " + (product.rating || "N/A") + " with " + product.stock + " in stock",
      product: product,
    });
  });

  return recommendations;
};

export const generateClientAlerts = (orders, inventory) => {
  const alerts = [];
  if (!orders && !inventory) return alerts;

  const inv = inventory || [];
  const ords = orders || [];

  const outOfStock = inv.filter((i) => Number(i.current_stock) === 0);
  if (outOfStock.length > 0) {
    alerts.push({
      id: "client_out_of_stock",
      type: "error",
      severity: "critical",
      title: "Out of Stock",
      message: outOfStock.length + " products are out of stock.",
      action_link: "/inventory",
      action_label: "Restock",
      timestamp: new Date().toISOString(),
    });
  }

  const lowStock = inv.filter(
    (i) =>
      Number(i.current_stock) > 0 &&
      Number(i.current_stock) <= Number(i.minimum_stock)
  );
  if (lowStock.length > 0) {
    alerts.push({
      id: "client_low_stock",
      type: "warning",
      severity: lowStock.length > 5 ? "high" : "medium",
      title: "Low Stock",
      message: lowStock.length + " products are below minimum stock.",
      action_link: "/inventory",
      action_label: "View",
      timestamp: new Date().toISOString(),
    });
  }

  const pendingOrders = ords.filter((o) => o.status === "Pending");
  if (pendingOrders.length > 0) {
    alerts.push({
      id: "client_pending_orders",
      type: "info",
      severity: pendingOrders.length > 10 ? "high" : "medium",
      title: "Pending Orders",
      message: pendingOrders.length + " orders need processing.",
      action_link: "/orders",
      action_label: "View",
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
};

export const generateClientSummary = (orders, products, customers) => {
  const today = new Date().toISOString().split("T")[0];
  const ords = orders || [];
  const todayOrders = ords.filter((o) => {
    if (!o.created_at) return false;
    return o.created_at.indexOf(today) === 0;
  });
  const revenue = todayOrders.reduce((sum, o) => {
    const add =
      o.status === "Delivered" || o.status === "Completed"
        ? Number(o.amount || 0)
        : 0;
    return sum + add;
  }, 0);

  return {
    date: today,
    orders_today: todayOrders.length,
    revenue_today: revenue,
    total_products: (products || []).length,
    total_customers: (customers || []).length,
    generated_at: new Date().toISOString(),
  };
};

const aiService = {
  getAiInsights,
  getAiAlerts,
  getAiRecommendations,
  getAiSummary,
  getAiMessages,
  generateClientRecommendations,
  generateClientAlerts,
  generateClientSummary,
};

export default aiService;
