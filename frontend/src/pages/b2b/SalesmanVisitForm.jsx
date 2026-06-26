import { useEffect, useState } from "react";
import { getSalesmanVisits, createSalesmanVisit, updateSalesmanVisit, deleteSalesmanVisit } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./SalesmanVisitForm.css";

const emptyForm = { customer_name: "", salesman_name: "", visit_date: "", purpose: "", outcome: "", follow_up_date: "", status: "Scheduled", notes: "" };

function SalesmanVisitForm() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await getSalesmanVisits();
      setVisits(res.data.visits || []);
    } catch (err) { setError("Failed to load visits."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisits(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editId) { await updateSalesmanVisit(editId, form); }
      else { await createSalesmanVisit(form); }
      setForm(emptyForm); setShowForm(false); setEditId(null);
      fetchVisits();
    } catch (err) { alert("Failed to save visit: " + (err.response?.data?.message || err.message)); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (v) => {
    setForm({ customer_name: v.customer_name, salesman_name: v.salesman_name, visit_date: v.visit_date ? v.visit_date.split("T")[0] : "", purpose: v.purpose || "", outcome: v.outcome || "", follow_up_date: v.follow_up_date ? v.follow_up_date.split("T")[0] : "", status: v.status || "Scheduled", notes: v.notes || "" });
    setEditId(v.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this visit record?")) return;
    await deleteSalesmanVisit(id); fetchVisits();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="salesman-visit">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>🚗 Salesman Visits</h1><p style={{ color: "var(--text-secondary)" }}>Log and track customer visits by the sales team.</p></div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>{showForm ? "✕ Cancel" : "+ Log Visit"}</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "Edit Visit" : "Log New Visit"}</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Customer Name *</label><input style={inputStyle} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required placeholder="Customer / Company" /></div>
            <div><label style={labelStyle}>Salesman Name *</label><input style={inputStyle} value={form.salesman_name} onChange={e => setForm({ ...form, salesman_name: e.target.value })} required placeholder="Sales rep name" /></div>
            <div><label style={labelStyle}>Visit Date *</label><input style={inputStyle} type="date" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} required /></div>
            <div><label style={labelStyle}>Follow-up Date</label><input style={inputStyle} type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} /></div>
            <div><label style={labelStyle}>Purpose</label><input style={inputStyle} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Product demo, renewal" /></div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Scheduled","Completed","Cancelled","No Show"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Outcome</label><textarea style={{ ...inputStyle, height: "60px" }} value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} placeholder="What was discussed / agreed..." /></div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: "60px" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." /></div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editId ? "Update Visit" : "Log Visit"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      {visits.length === 0
        ? <EmptyState title="No Visits Logged" message="Log your first salesman visit using the button above." />
        : <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={th}>#</th><th style={th}>Customer</th><th style={th}>Salesman</th><th style={th}>Visit Date</th><th style={th}>Purpose</th><th style={th}>Outcome</th><th style={th}>Follow-up</th><th style={th}>Status</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>{v.id}</td>
                    <td style={td}><strong>{v.customer_name}</strong></td>
                    <td style={td}>{v.salesman_name}</td>
                    <td style={td}>{v.visit_date ? new Date(v.visit_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={td}>{v.purpose || "—"}</td>
                    <td style={{ ...td, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.outcome || "—"}</td>
                    <td style={td}>{v.follow_up_date ? new Date(v.follow_up_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={td}><StatusBadge status={v.status} /></td>
                    <td style={{ ...td, display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleEdit(v)} style={editBtnStyle}>Edit</button>
                      <button onClick={() => handleDelete(v.id)} style={deleteBtnStyle}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" };
const th = { padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" };
const td = { padding: "0.75rem 1rem" };
const editBtnStyle = { padding: "0.3rem 0.7rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "0.8rem" };
const deleteBtnStyle = { padding: "0.3rem 0.7rem", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: "0.8rem" };

export default SalesmanVisitForm;
