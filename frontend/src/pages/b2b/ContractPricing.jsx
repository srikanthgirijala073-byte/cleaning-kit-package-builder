import { useEffect, useState } from "react";
import { getContracts, createContract, updateContract, deleteContract } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./ContractPricing.css";

const emptyForm = { customer_name: "", contract_name: "", discount_percent: "", tier: "Bronze", start_date: "", end_date: "", status: "Active", terms: "" };

function ContractPricing() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchContracts = async () => {
    try { setLoading(true); const res = await getContracts(); setContracts(res.data.contracts || []); }
    catch (err) { setError("Failed to load contracts."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContracts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...form, discount_percent: Number(form.discount_percent) || 0 };
      if (editId) { await updateContract(editId, payload); } else { await createContract(payload); }
      setForm(emptyForm); setShowForm(false); setEditId(null); fetchContracts();
    } catch (err) { alert("Failed to save contract: " + (err.response?.data?.message || err.message)); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (c) => {
    setForm({ customer_name: c.customer_name, contract_name: c.contract_name, discount_percent: c.discount_percent || "", tier: c.tier || "Bronze", start_date: c.start_date ? c.start_date.split("T")[0] : "", end_date: c.end_date ? c.end_date.split("T")[0] : "", status: c.status || "Active", terms: c.terms || "" });
    setEditId(c.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (!window.confirm("Delete this contract?")) return; await deleteContract(id); fetchContracts(); };

  if (loading) return <LoadingSpinner />;

  const tierColors = { Bronze: "#cd7f32", Silver: "#c0c0c0", Gold: "#ffd700", Platinum: "#e5e4e2" };

  return (
    <div className="contract-pricing">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>📜 Contract Pricing</h1><p style={{ color: "var(--text-secondary)" }}>Manage customer contracts and discount tiers.</p></div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>{showForm ? "✕ Cancel" : "+ New Contract"}</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "Edit Contract" : "New Contract"}</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Customer Name *</label><input style={inputStyle} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required /></div>
            <div><label style={labelStyle}>Contract Name *</label><input style={inputStyle} value={form.contract_name} onChange={e => setForm({ ...form, contract_name: e.target.value })} required placeholder="e.g. Annual Hotel Contract 2026" /></div>
            <div><label style={labelStyle}>Discount %</label><input style={inputStyle} type="number" min="0" max="100" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} placeholder="e.g. 15" /></div>
            <div><label style={labelStyle}>Tier</label>
              <select style={inputStyle} value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}>
                {["Bronze","Silver","Gold","Platinum"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Start Date</label><input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label style={labelStyle}>End Date</label><input style={inputStyle} type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Active","Pending","Expired","Terminated"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Terms & Conditions</label><textarea style={{ ...inputStyle, height: "80px" }} value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} /></div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editId ? "Update Contract" : "Create Contract"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      {contracts.length === 0
        ? <EmptyState title="No Contracts" message="Create your first contract using the button above." />
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "1rem" }}>
            {contracts.map(c => (
              <div key={c.id} style={{ ...cardStyle, borderTop: `4px solid ${tierColors[c.tier] || "#ccc"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 700 }}>{c.contract_name}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{c.customer_name}</div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ background: tierColors[c.tier] + "22", border: `1px solid ${tierColors[c.tier]}`, borderRadius: "20px", padding: "2px 10px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.tier}</div>
                  <div style={{ fontWeight: 700, color: "#10b981" }}>{c.discount_percent}% off</div>
                </div>
                {c.start_date && <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{new Date(c.start_date).toLocaleDateString("en-IN")} – {c.end_date ? new Date(c.end_date).toLocaleDateString("en-IN") : "Ongoing"}</div>}
                <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleEdit(c)} style={editBtnStyle}>Edit</button>
                  <button onClick={() => handleDelete(c.id)} style={deleteBtnStyle}>Delete</button>
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
const editBtnStyle = { padding: "0.3rem 0.75rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "0.8rem" };
const deleteBtnStyle = { padding: "0.3rem 0.75rem", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: "0.8rem" };

export default ContractPricing;
