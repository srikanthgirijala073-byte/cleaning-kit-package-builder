import { useEffect, useState } from "react";
import { getReorders, getReorderSuggestions, createReorder, approveReorder } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./ReorderDashboard.css";

function ReorderDashboard() {
  const [reorders, setReorders] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reorders");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ product_name: "", quantity: "", supplier: "", notes: "", source: "manual" });
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [reordersRes, suggestionsRes] = await Promise.all([
        getReorders().catch(() => ({ data: { reorders: [] } })),
        getReorderSuggestions().catch(() => ({ data: { suggestions: [] } })),
      ]);
      setReorders(reordersRes.data.reorders || []);
      setSuggestions(suggestionsRes.data.suggestions || []);
    } catch (err) {
      setError("Failed to load reorder data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.product_name || !form.quantity) return;
    try {
      setSubmitting(true);
      await createReorder({ ...form, quantity: Number(form.quantity) });
      setForm({ product_name: "", quantity: "", supplier: "", notes: "", source: "manual" });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      alert("Failed to create reorder: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveReorder(id);
      fetchAll();
    } catch (err) {
      alert("Failed to approve reorder: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateFromSuggestion = async (s) => {
    try {
      await createReorder({ product_id: s.product_id, product_name: s.product_name, quantity: s.suggested_quantity, source: "auto-suggestion", notes: `Auto-suggested: stock ${s.current_stock} below min ${s.minimum_stock}` });
      fetchAll();
      setActiveTab("reorders");
    } catch (err) {
      alert("Failed to create reorder from suggestion: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="reorder-dashboard">
      <div className="reorder-header">
        <div>
          <h1>🔄 Reorder Dashboard</h1>
          <p>Manage stock reorders and low-inventory alerts.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ New Reorder"}
        </button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>Create Reorder</h3>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input style={inputStyle} value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. Disinfectant Spray 500ml" required />
            </div>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input style={inputStyle} type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 50" required />
            </div>
            <div>
              <label style={labelStyle}>Supplier</label>
              <input style={inputStyle} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" />
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <select style={inputStyle} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                <option value="manual">Manual</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, height: "60px" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Reorder"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {["reorders", "suggestions"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "0.5rem 1.25rem", borderRadius: "20px", border: "none", cursor: "pointer", background: activeTab === t ? "var(--primary)" : "var(--bg-secondary)", color: activeTab === t ? "#fff" : "var(--text-primary)", fontWeight: activeTab === t ? 600 : 400 }}>
            {t === "reorders" ? `Reorders (${reorders.length})` : `Suggestions (${suggestions.length})`}
          </button>
        ))}
      </div>

      {activeTab === "reorders" && (
        reorders.length === 0
          ? <EmptyState title="No Reorders" message="Create your first reorder using the button above." />
          : <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    <th style={th}>#</th><th style={th}>Product</th><th style={th}>Qty</th><th style={th}>Supplier</th><th style={th}>Source</th><th style={th}>Status</th><th style={th}>Date</th><th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reorders.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={td}>{r.id}</td>
                      <td style={td}><strong>{r.product_name}</strong>{r.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{r.notes}</div>}</td>
                      <td style={td}>{r.quantity}</td>
                      <td style={td}>{r.supplier || "—"}</td>
                      <td style={td}><span style={chipStyle}>{r.source}</span></td>
                      <td style={td}><StatusBadge status={r.status} /></td>
                      <td style={td}>{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={td}>
                        {r.status === "Pending" && (
                          <button onClick={() => handleApprove(r.id)} style={approveBtnStyle}>Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {activeTab === "suggestions" && (
        suggestions.length === 0
          ? <EmptyState title="No Low-Stock Alerts" message="All products are above minimum stock levels." />
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
              {suggestions.map(s => (
                <div key={s.product_id} style={{ background: "var(--bg-secondary)", border: "1px solid #fbbf24", borderRadius: "12px", padding: "1.25rem" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>⚠️ {s.product_name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    Current: <strong style={{ color: "#ef4444" }}>{s.current_stock}</strong> / Min: {s.minimum_stock}<br />
                    Suggested order: <strong>{s.suggested_quantity}</strong> units
                  </div>
                  <button onClick={() => handleCreateFromSuggestion(s)} style={approveBtnStyle}>Create Reorder</button>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}

const formStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" };
const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-secondary)" };
const inputStyle = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.9rem", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" };
const th = { padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" };
const td = { padding: "0.75rem 1rem", whiteSpace: "nowrap" };
const chipStyle = { background: "var(--bg-primary)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", border: "1px solid var(--border)" };
const approveBtnStyle = { padding: "0.4rem 0.9rem", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" };

export default ReorderDashboard;
