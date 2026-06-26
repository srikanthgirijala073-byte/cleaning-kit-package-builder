import { useEffect, useState } from "react";
import { getComplianceRecords, createComplianceRecord, updateComplianceRecord } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./CompliancePortal.css";

const emptyForm = { customer_name: "", compliance_type: "", description: "", severity: "Medium", target_date: "", findings: "", action_taken: "", status: "Open" };

function CompliancePortal() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("All");

  const fetchRecords = async () => {
    try { setLoading(true); const res = await getComplianceRecords(); setRecords(res.data.records || []); }
    catch (err) { setError("Failed to load compliance records."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editId) { await updateComplianceRecord(editId, form); }
      else { await createComplianceRecord(form); }
      setForm(emptyForm); setShowForm(false); setEditId(null); fetchRecords();
    } catch (err) { alert("Failed to save record: " + (err.response?.data?.message || err.message)); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (r) => {
    setForm({ customer_name: r.customer_name, compliance_type: r.compliance_type, description: r.description || "", severity: r.severity || "Medium", target_date: r.target_date ? r.target_date.split("T")[0] : "", findings: r.findings || "", action_taken: r.action_taken || "", status: r.status || "Open" });
    setEditId(r.id); setShowForm(true);
  };

  if (loading) return <LoadingSpinner />;

  const severityColors = { Low: "#10b981", Medium: "#f59e0b", High: "#f97316", Critical: "#ef4444" };
  const filtered = filterSeverity === "All" ? records : records.filter(r => r.severity === filterSeverity);

  const summary = { Open: 0, "In Progress": 0, Resolved: 0, Overdue: 0 };
  records.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });

  return (
    <div className="compliance-portal">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>🛡️ Compliance Portal</h1><p style={{ color: "var(--text-secondary)" }}>Track and manage compliance requirements and audit findings.</p></div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>{showForm ? "✕ Cancel" : "+ New Record"}</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {Object.entries(summary).map(([s, count]) => (
          <div key={s} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{count}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{s}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>{editId ? "Edit Record" : "New Compliance Record"}</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Customer / Facility *</label><input style={inputStyle} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required /></div>
            <div><label style={labelStyle}>Compliance Type *</label><input style={inputStyle} value={form.compliance_type} onChange={e => setForm({ ...form, compliance_type: e.target.value })} required placeholder="e.g. Safety Audit, MSDS Review" /></div>
            <div><label style={labelStyle}>Severity</label>
              <select style={inputStyle} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {["Low","Medium","High","Critical"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {["Open","In Progress","Resolved","Overdue"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Target Date</label><input style={inputStyle} type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} /></div>
          </div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, height: "60px" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Findings</label><textarea style={{ ...inputStyle, height: "60px" }} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} /></div>
          <div style={{ marginTop: "0.75rem" }}><label style={labelStyle}>Action Taken</label><textarea style={{ ...inputStyle, height: "60px" }} value={form.action_taken} onChange={e => setForm({ ...form, action_taken: e.target.value })} /></div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editId ? "Update" : "Create Record"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["All","Low","Medium","High","Critical"].map(s => (
          <button key={s} onClick={() => setFilterSeverity(s)} style={{ padding: "0.4rem 1rem", borderRadius: "20px", border: "none", cursor: "pointer", background: filterSeverity === s ? (severityColors[s] || "var(--primary)") : "var(--bg-secondary)", color: filterSeverity === s ? "#fff" : "var(--text-primary)", fontSize: "0.85rem", fontWeight: filterSeverity === s ? 600 : 400 }}>{s}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <EmptyState title="No Records Found" message="Create your first compliance record or adjust the filter." />
        : <div style={{ display: "grid", gap: "1rem" }}>
            {filtered.map(r => (
              <div key={r.id} style={{ ...cardStyle, borderLeft: `4px solid ${severityColors[r.severity] || "#ccc"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{r.compliance_type}</span>
                    <span style={{ marginLeft: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", background: severityColors[r.severity] + "22", color: severityColors[r.severity], border: `1px solid ${severityColors[r.severity]}`, fontWeight: 600 }}>{r.severity}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>👤 {r.customer_name} {r.target_date ? `| 🗓 Due: ${new Date(r.target_date).toLocaleDateString("en-IN")}` : ""}</div>
                {r.description && <div style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>{r.description}</div>}
                {r.findings && <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Findings: {r.findings}</div>}
                {r.action_taken && <div style={{ fontSize: "0.8rem", color: "#10b981" }}>Action: {r.action_taken}</div>}
                <button onClick={() => handleEdit(r)} style={{ marginTop: "0.75rem", ...editBtnStyle }}>Edit</button>
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

export default CompliancePortal;
