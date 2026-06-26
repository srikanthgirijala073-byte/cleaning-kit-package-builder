import { useEffect, useState } from "react";
import { getQuotations, createQuotation, updateQuotation, deleteQuotation, convertQuotationToOrder } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./QuotationBuilder.css";

const emptyForm = { customer_name: "", package_name: "", facility_type: "", total_amount: "", valid_until: "", notes: "", status: "Draft", items: [] };

function QuotationBuilder() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await getQuotations();
      setQuotations(res.data.quotations || []);
    } catch (err) {
      setError("Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name) return;
    try {
      setSubmitting(true);
      const payload = { ...form, total_amount: Number(form.total_amount) || 0 };
      if (editId) { await updateQuotation(editId, payload); }
      else { await createQuotation(payload); }
      setForm(emptyForm); setShowForm(false); setEditId(null);
      fetchQuotations();
    } catch (err) {
      alert("Failed to save quotation: " + (err.response?.data?.message || err.message));
    } finally { setSubmitting(false); }
  };

  const handleEdit = (q) => {
    setForm({ customer_name: q.customer_name, package_name: q.package_name || "", facility_type: q.facility_type || "", total_amount: q.total_amount || "", valid_until: q.valid_until ? q.valid_until.split("T")[0] : "", notes: q.notes || "", status: q.status || "Draft", items: q.items || [] });
    setEditId(q.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quotation?")) return;
    await deleteQuotation(id); fetchQuotations();
  };

  const handleConvert = async (id) => {
    if (!window.confirm("Convert this quotation to an order?")) return;
    try { const res = await convertQuotationToOrder(id); alert(`Converted! Order #${res.data.order_id} created.`); fetchQuotations(); }
    catch (err) { alert("Failed to convert: " + (err.response?.data?.message || err.message)); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="quotation-builder">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>📄 Quotation Builder</h1><p style={{ color: "var(--text-secondary)" }}>Create and manage customer quotations.</p></div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>{showForm ? "✕ Cancel" : "+ New Quotation"}</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "Edit Quotation" : "New Quotation"}</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Customer Name *</label><input style={inputStyle} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="Customer / Company name" required /></div>
            <div><label style={labelStyle}>Package Name</label><input style={inputStyle} value={form.package_name} onChange={e => setForm({ ...form, package_name: e.target.value })} placeholder="e.g. Hotel Cleaning Bundle" /></div>
            <div><label style={labelStyle}>Facility Type</label>
              <select style={inputStyle} value={form.facility_type} onChange={e => setForm({ ...form, facility_type: e.target.value })}>
                <option value="">Select facility...</option>
                {["Hospitality","Healthcare","Education","Office","Industrial","Residential"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Total Amount (₹)</label><input style={inputStyle} type="number" min="0" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="0" /></div>
            <div><label style={labelStyle}>Valid Until</label><input style={inputStyle} type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Draft","Sent","Accepted","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: "70px" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Terms, conditions, remarks..." /></div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editId ? "Update Quotation" : "Create Quotation"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      {quotations.length === 0
        ? <EmptyState title="No Quotations Yet" message="Create your first quotation using the button above." />
        : <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={th}>#</th><th style={th}>Customer</th><th style={th}>Package</th><th style={th}>Facility</th><th style={th}>Amount</th><th style={th}>Valid Until</th><th style={th}>Status</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>{q.id}</td>
                    <td style={td}><strong>{q.customer_name}</strong></td>
                    <td style={td}>{q.package_name || "—"}</td>
                    <td style={td}>{q.facility_type || "—"}</td>
                    <td style={td}>₹{Number(q.total_amount || 0).toLocaleString("en-IN")}</td>
                    <td style={td}>{q.valid_until ? new Date(q.valid_until).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={td}><StatusBadge status={q.status} /></td>
                    <td style={{ ...td, display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleEdit(q)} style={editBtnStyle}>Edit</button>
                      {q.status !== "Converted" && <button onClick={() => handleConvert(q.id)} style={convertBtnStyle}>→ Order</button>}
                      <button onClick={() => handleDelete(q.id)} style={deleteBtnStyle}>✕</button>
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
const convertBtnStyle = { padding: "0.3rem 0.7rem", borderRadius: "6px", border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: "0.8rem" };
const deleteBtnStyle = { padding: "0.3rem 0.7rem", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: "0.8rem" };

export default QuotationBuilder;
