import { useEffect, useState } from "react";
import { getOrders } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import "./History.css";

function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await getOrders({ limit: 50, sort: "created_at", order: "DESC" });
        const data = res.data;
        setOrders(
          Array.isArray(data) ? data : Array.isArray(data.orders) ? data.orders : []
        );
      } catch (err) {
        console.error("History fetch error:", err);
        setError("Could not load order history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const statuses = ["All", "placed", "processing", "packed", "shipped", "delivered", "cancelled"];

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(o.order_id).includes(search);
    const matchStatus =
      selectedStatus === "All" || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>📋 Order History</h1>
        <p>Complete timeline of all orders from the database.</p>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="history-controls" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
        <SearchBar
          placeholder="Search by customer name or order ID..."
          value={search}
          onChange={(val) => setSearch(typeof val === "string" ? val : val?.target?.value || "")}
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.9rem" }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginLeft: "auto" }}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No orders found"
          message={search || selectedStatus !== "All" ? "Try adjusting your search or filter." : "No orders have been placed yet."}
        />
      ) : (
        <div className="history-timeline">
          {filtered.map((order) => (
            <div key={order.order_id} className="history-item" style={itemStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Order #{order.order_id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>
                    {order.customer_name || "Guest Customer"}
                  </div>
                  {order.facility_type && (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      🏢 {order.facility_type}
                    </div>
                  )}
                  {order.notes && (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      📝 {order.notes}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary)" }}>
                    ₹{Number(order.total_amount || order.amount || 0).toLocaleString("en-IN")}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : ""}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const itemStyle = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "1.25rem",
  marginBottom: "0.75rem",
  transition: "box-shadow 0.2s",
};

export default History;
