const { query } = require("../config/db");

async function getReorderRecommendations() {
  try {
    var lowStock = await query("SELECT i.inventory_id, p.product_id, p.name, p.category, i.current_stock, i.minimum_stock, (i.minimum_stock * 2 - i.current_stock) AS suggested_order_qty FROM inventory i JOIN products p ON i.product_id = p.product_id WHERE i.current_stock <= i.minimum_stock * 1.5 ORDER BY (i.current_stock - i.minimum_stock) ASC LIMIT 10");
    var critical = lowStock.filter(function(i) { return i.current_stock <= i.minimum_stock; });
    var warning = lowStock.filter(function(i) { return i.current_stock > i.minimum_stock; });
    return { type: "reorder_recommendation", total_items: lowStock.length, critical_count: critical.length, warning_count: warning.length, items: lowStock.map(function(i) { return Object.assign({}, i, { priority: i.current_stock <= i.minimum_stock ? "Critical" : "Warning" }); }), generated_at: new Date().toISOString(), message: critical.length + " products critically low, " + warning.length + " approaching minimum stock" };
  } catch(err) { return { type: "reorder_recommendation", error: err.message, items: [] }; }
}

async function getDailySummary() {
  try {
    var today = new Date().toISOString().split("T")[0];
    var r = await Promise.all([
      query("SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ?", [today]),
      query("SELECT COALESCE(SUM(amount), 0) AS revenue FROM orders WHERE DATE(created_at) = ? AND status IN ('Delivered','Completed')", [today]),
      query("SELECT COUNT(*) AS count FROM customers WHERE DATE(created_at) = ?", [today]),
      query("SELECT COUNT(*) AS count FROM orders WHERE status IN ('Pending','Processing')"),
      query("SELECT COUNT(*) AS count FROM inventory WHERE current_stock <= minimum_stock")
    ]);
    return { type: "daily_summary", date: today, orders_today: (r[0][0] && r[0][0].count) || 0, revenue_today: Number((r[1][0] && r[1][0].revenue) || 0), new_customers: (r[2][0] && r[2][0].count) || 0, pending_orders: (r[3][0] && r[3][0].count) || 0, low_stock_items: (r[4][0] && r[4][0].count) || 0, generated_at: new Date().toISOString(), summary: ((r[0][0] && r[0][0].count) || 0) + " orders today, ₹" + Number((r[1][0] && r[1][0].revenue) || 0).toLocaleString("en-IN") + " revenue" };
  } catch(err) { return { type: "daily_summary", error: err.message }; }
}

async function getOrderSummary() {
  try {
    var stats = await query("SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status IN ('Delivered','Completed') THEN amount ELSE 0 END) AS revenue FROM orders");
    var s = (stats && stats[0]) || {};
    var total = Number(s.total || 0);
    var p = Number(s.pending || 0);
    var r = Number(s.revenue || 0);
    var rate = total > 0 ? Math.round(((total - p) / total) * 100) : 0;
    return { type: "order_summary", total_orders: total, pending: p, revenue: r, fulfillment_rate: rate, generated_at: new Date().toISOString(), summary: rate + "% fulfillment rate across " + total + " orders" };
  } catch(err) { return { type: "order_summary", error: err.message }; }
}

async function getSystemAlerts() {
  var alerts = [];
  try {
    var cs = await query("SELECT COUNT(*) AS count FROM inventory WHERE current_stock <= minimum_stock AND current_stock > 0");
    if(cs[0] && cs[0].count > 0) alerts.push({ id: "alert_low_stock", type: "warning", severity: cs[0].count > 5 ? "high" : "medium", title: "Low Stock Alert", message: cs[0].count + " products below minimum stock.", actionable: true, action_link: "/inventory", action_label: "View", timestamp: new Date().toISOString() });
    var os = await query("SELECT COUNT(*) AS count FROM inventory WHERE current_stock = 0");
    if(os[0] && os[0].count > 0) alerts.push({ id: "alert_out_of_stock", type: "error", severity: "critical", title: "Out of Stock", message: os[0].count + " products out of stock.", actionable: true, action_link: "/inventory", action_label: "Restock", timestamp: new Date().toISOString() });
    var p = await query("SELECT COUNT(*) AS count FROM orders WHERE status = 'Pending'");
    if(p[0] && p[0].count > 0) alerts.push({ id: "alert_pending", type: "info", severity: p[0].count > 10 ? "high" : "medium", title: "Pending Orders", message: p[0].count + " orders pending.", actionable: true, action_link: "/orders", action_label: "View", timestamp: new Date().toISOString() });
  } catch(err) { console.error(err.message); }
  return { type: "system_alerts", total: alerts.length, alerts: alerts, generated_at: new Date().toISOString() };
}

async function getAutoMessages() {
  var messages = [];
  try {
    var rc = await query("SELECT order_id, customer_name, updated_at FROM orders WHERE status = 'Delivered' AND updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY updated_at DESC LIMIT 3");
    if(rc && rc.length > 0) {
      rc.forEach(function(o) { messages.push({ id: "msg_" + o.order_id, type: "order_update", title: "Order Delivered", message: "Order #" + o.order_id + " delivered to " + o.customer_name, severity: "success", timestamp: o.updated_at }); });
    }
    messages.push({ id: "msg_system", type: "system", title: "System Online", message: "All systems operational.", severity: "success", timestamp: new Date().toISOString() });
  } catch(err) { console.error(err.message); }
  return { type: "auto_messages", total: messages.length, messages: messages, generated_at: new Date().toISOString() };
}

async function getPopularProducts() {
  try { return { type: "popular_products", items: await query("SELECT p.product_id, p.name, p.category, p.price, p.stock, p.rating, COALESCE(SUM(oi.quantity), 0) AS total_ordered FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id ORDER BY total_ordered DESC, p.rating DESC LIMIT 6"), generated_at: new Date().toISOString() }; }
  catch(err) { return { type: "popular_products", error: err.message, items: [] }; }
}

async function getAllInsights() {
  var r = await Promise.all([getDailySummary(), getOrderSummary(), getSystemAlerts(), getAutoMessages(), getPopularProducts()]);
  return { generated_at: new Date().toISOString(), daily_summary: r[0], order_summary: r[1], alerts: r[2], messages: r[3], popular_products: r[4] };
}

module.exports = { getReorderRecommendations, getDailySummary, getOrderSummary, getSystemAlerts, getAutoMessages, getPopularProducts, getAllInsights };
