import { useEffect, useState } from "react";
import { getWarehouses, createWarehouse, updateWarehouse, getWarehouseStock, addWarehouseStock } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import "./WarehouseManagement.css";

function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [wForm, setWForm] = useState({ name: "", location: "", manager_name: "", capacity: "" });
  const [sForm, setSForm] = useState({ product_name: "", quantity: "", zone: "", bin_location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchWarehouses = async () => {
    try { setLoading(true); const res = await getWarehouses(); setWarehouses(res.data.warehouses || []); }
    catch (err) { setError("Failed to load warehouses."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchStock = async (wid) => {
    try {
      setStockLoading(true);
      const res = await getWarehouseStock(wid);
      setStock(res.data.stock || []);
    } catch (err) { setStock([]); }
    finally { setStockLoading(false); }
  };

  const handleSelectWarehouse = (w) => { setSelectedWarehouse(w); fetchStock(w.id); setShowStockForm(false); };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createWarehouse({ ...wForm, capacity: Number(wForm.capacity) || 0 });
      setWForm({ name: "", location: "", manager_name: "", capacity: "" });
      setShowWarehouseForm(false); fetchWarehouses();
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
    finally { setSubmitting(false); }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await addWarehouseStock(selectedWarehouse.id, { ...sForm, quantity: Number(sForm.quantity) || 0 });
      setSForm({ product_name: "", quantity: "", zone: "", bin_location: "" });
      setShowStockForm(false); fetchStock(selectedWarehouse.id);
    } catch (err) { alert("Failed: " + (err.response?.data?.message || err.message)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="warehouse-management">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>🏭 Warehouse Management</h1><p style={{ color: "var(--text-secondary)" }}>Manage warehouse locations, zones, and stock.</p></div>
        <button className="btn-primary" onClick={() => setShowWarehouseForm(!showWarehouseForm)}>{showWarehouseForm ? "✕ Cancel" : "+ New Warehouse"}</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

      {showWarehouseForm && (
        <form onSubmit={handleCreateWarehouse} style={formStyle}>
          <h3 style={{ marginBottom: "1rem" }}>Add Warehouse</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Warehouse Name *</label><input style={inputStyle} value={wForm.name} onChange={e => setWForm({ ...wForm, name: e.target.value })} required /></div>
            <div><label style={labelStyle}>Location</label><input style={inputStyle} value={wForm.location} onChange={e => setWForm({ ...wForm, location: e.target.value })} /></div>
            <div><label style={labelStyle}>Manager Name</label><input style={inputStyle} value={wForm.manager_name} onChange={e => setWForm({ ...wForm, manager_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Capacity</label><input style={inputStyle} type="number" value={wForm.capacity} onChange={e => setWForm({ ...wForm, capacity: e.target.value })} /></div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Create Warehouse"}</button>
            <button type="button" onClick={() => setShowWarehouseForm(false)} style={cancelBtnStyle}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedWarehouse ? "1fr 2fr" : "1fr", gap: "1.5rem" }}>
        {/* Warehouse list */}
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Warehouses ({warehouses.length})</h2>
          {warehouses.length === 0
            ? <EmptyState title="No Warehouses" message="Create your first warehouse above." />
            : warehouses.map(w => (
                <div key={w.id} onClick={() => handleSelectWarehouse(w)} style={{ ...warehouseCardStyle, borderColor: selectedWarehouse?.id === w.id ? "var(--primary)" : "var(--border)", cursor: "pointer", background: selectedWarehouse?.id === w.id ? "var(--primary-light, #eff6ff)" : "var(--bg-secondary)" }}>
                  <div style={{ fontWeight: 700 }}>🏭 {w.name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    {w.location && <span>📍 {w.location} </span>}
                    {w.manager_name && <span>👤 {w.manager_name}</span>}
                  </div>
                  <div style={{ marginTop: "0.25rem" }}><StatusBadge status={w.status} /></div>
                  {w.capacity > 0 && <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Capacity: {w.capacity} units</div>}
                </div>
              ))
          }
        </div>

        {/* Stock panel */}
        {selectedWarehouse && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>📦 Stock — {selectedWarehouse.name}</h2>
              <button className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem" }} onClick={() => setShowStockForm(!showStockForm)}>+ Add Stock</button>
            </div>

            {showStockForm && (
              <form onSubmit={handleAddStock} style={{ ...formStyle, marginBottom: "1rem" }}>
                <div style={gridStyle}>
                  <div><label style={labelStyle}>Product Name *</label><input style={inputStyle} value={sForm.product_name} onChange={e => setSForm({ ...sForm, product_name: e.target.value })} required /></div>
                  <div><label style={labelStyle}>Quantity *</label><input style={inputStyle} type="number" value={sForm.quantity} onChange={e => setSForm({ ...sForm, quantity: e.target.value })} required /></div>
                  <div><label style={labelStyle}>Zone</label><input style={inputStyle} value={sForm.zone} onChange={e => setSForm({ ...sForm, zone: e.target.value })} placeholder="e.g. A" /></div>
                  <div><label style={labelStyle}>Bin</label><input style={inputStyle} value={sForm.bin_location} onChange={e => setSForm({ ...sForm, bin_location: e.target.value })} placeholder="e.g. A1-3" /></div>
                </div>
                <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Adding..." : "Add Stock"}</button>
                  <button type="button" onClick={() => setShowStockForm(false)} style={cancelBtnStyle}>Cancel</button>
                </div>
              </form>
            )}

            {stockLoading ? <LoadingSpinner /> : stock.length === 0
              ? <EmptyState title="No Stock" message="Add stock items to this warehouse." />
              : <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead><tr style={{ background: "var(--bg-primary)" }}>
                      <th style={th}>Product</th><th style={th}>Zone</th><th style={th}>Bin</th><th style={th}>Qty</th>
                    </tr></thead>
                    <tbody>
                      {stock.map(s => (
                        <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={td}>{s.product_name}</td>
                          <td style={td}>{s.zone || "—"}</td>
                          <td style={td}>{s.bin_location || "—"}</td>
                          <td style={{ ...td, fontWeight: 700, color: s.quantity < 10 ? "#ef4444" : "inherit" }}>{s.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

const formStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" };
const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-secondary)" };
const inputStyle = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.9rem", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" };
const warehouseCardStyle = { border: "1px solid", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" };
const th = { padding: "0.6rem 1rem", textAlign: "left", fontWeight: 600 };
const td = { padding: "0.6rem 1rem" };

export default WarehouseManagement;
