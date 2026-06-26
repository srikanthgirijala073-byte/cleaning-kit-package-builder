import { useEffect, useState } from "react";
import { getDeliveries, createDelivery, updateDelivery, updateDeliveryStatus } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./DeliveryTracker.css";

const emptyForm = { customer_name: "", order_id: "", address: "", delivery_date: "", driver_name: "", vehicle_number: "", notes: "", status: "Scheduled" };

function DeliveryTracker() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await getDeliveries();
      setDeliveries(res.data.deliveries || []);
    } catch (err) { setError("Failed to load deliveries."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...form, order_id: form.order_id ? Number(form.order_id) : null };
      if (editId) { await updateDelivery(editId, payload); }
      else { await createDelivery(payload); }
      setForm(emptyForm); setShowForm(false); setEditId(null);
      fetchDeliveries();
    } catch (err) { alert("Failed to save delivery: " + (err.response?.data?.message || err.message)); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await updateDeliveryStatus(id, newStatus); fetchDeliveries(); }
    catch (err) { alert("Failed to update status."); }
  };

  const handleEdit = (d) => {
    setForm({ customer_name: d.customer_name, order_id: d.order_id || "", address: d.address || "", delivery_date: d.delivery_date ? d.delivery_date.split("T")[0] : "", driver_name: d.driver_name || "", vehicle_number: d.vehicle_number || "", notes: d.notes || "", status: d.status || "Scheduled" });
    setEditId(d.id); setShowForm(true);
  };

  if (loading) return <LoadingSpinner />;

  const statusSteps = ["Scheduled", "In Transit", "Delivered"];

  return (
    <div className="delivery-tracker">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>🚚 Delivery Tracker</h1><p style={{ color: "var(--text-secondary)" }}>Track all outbound deliveries in real time.</p></div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>{showForm ? "✕ Cancel" : "+ New Delivery"}</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "Edit Delivery" : "Schedule Delivery"}</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Customer Name *</label><input style={inputStyle} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required /></div>
            <div><label style={labelStyle}>Order ID (optional)</label><input style={inputStyle} type="number" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} placeholder="Linked order #" /></div>
            <div><label style={labelStyle}>Delivery Date</label><input style={inputStyle} type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></div>
            <div><label style={labelStyle}>Driver Name</label><input style={inputStyle} value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Vehicle Number</label><input style={inputStyle} value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Scheduled","In Transit","Delivered","Failed","Returned"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Delivery Address</label><textarea style={{ ...inputStyle, height: "60px" }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: "50px" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editId ? "Update" : "Schedule Delivery"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      {deliveries.length === 0
        ? <EmptyState title="No Deliveries Scheduled" message="Schedule your first delivery using the button above." />
        : <div style={{ display: "grid", gap: "1rem" }}>
            {deliveries.map(d => (
              <div key={d.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>🚚 Delivery #{d.id} — {d.customer_name}</div>
                    {d.order_id && <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Order #{d.order_id}</div>}
                    {d.address && <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>📍 {d.address}</div>}
                    {d.driver_name && <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>🧑‍✈️ {d.driver_name} {d.vehicle_number ? `| ${d.vehicle_number}` : ""}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <StatusBadge status={d.status} />
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                      {d.delivery_date ? new Date(d.delivery_date).toLocaleDateString("en-IN") : "Date TBD"}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["Scheduled","In Transit","Delivered"].map(s => (
                    <button key={s} onClick={() => handleStatusChange(d.id, s)} style={{ padding: "0.3rem 0.75rem", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.8rem", background: d.status === s ? "#2563eb" : "var(--bg-primary)", color: d.status === s ? "#fff" : "var(--text-secondary)", fontWeight: d.status === s ? 600 : 400 }}>{s}</button>
                  ))}
                  <button onClick={() => handleEdit(d)} style={{ marginLeft: "auto", padding: "0.3rem 0.75rem", borderRadius: "8px", border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

const formStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" };
const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-secondary)" };
const inputStyle = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.9rem", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" };
const cardStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" };

export default DeliveryTracker;
