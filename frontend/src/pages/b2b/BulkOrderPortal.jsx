import { useEffect, useState, useRef } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getProducts, getCustomers, createBulkOrder } from "../../services/api";
import { FaFileUpload, FaPlus, FaTrash, FaCheckCircle, FaExclamationTriangle, FaShoppingBag } from "react-icons/fa";
import "./BulkOrderPortal.css";

const EMPTY_LINE = () => ({ product_id: "", quantity: 1, price: 0, name: "", error: "" });

function BulkOrderPortal() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState([EMPTY_LINE(), EMPTY_LINE()]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [csvError, setCsvError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          getProducts({ limit: 100 }),
          getCustomers({ limit: 100 }),
        ]);
        setProducts(pRes.data.products || pRes.data || []);
        setCustomers(cRes.data.customers || cRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const productMap = Object.fromEntries(products.map(p => [String(p.product_id), p]));

  const updateLine = (idx, field, value) => {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "product_id") {
        const p = productMap[value];
        next[idx].price = p ? p.price : 0;
        next[idx].name = p ? p.name : "";
        next[idx].error = "";
      }
      if (field === "quantity") {
        const p = productMap[next[idx].product_id];
        if (p && value > p.stock) next[idx].error = `Only ${p.stock} in stock`;
        else next[idx].error = "";
      }
      return next;
    });
  };

  const addLine = () => setLines(prev => [...prev, EMPTY_LINE()]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const total = lines.reduce((s, l) => {
    const p = productMap[l.product_id];
    return s + (p ? p.price * (parseInt(l.quantity) || 0) : 0);
  }, 0);

  const validLines = lines.filter(l => l.product_id && parseInt(l.quantity) > 0);

  const handleSubmit = async () => {
    if (!customerName) return alert("Please enter a customer name");
    if (validLines.length === 0) return alert("Add at least one product line");
    if (lines.some(l => l.error)) return alert("Fix stock errors before submitting");
    try {
      setSubmitting(true);
      const res = await createBulkOrder({
        customer_name: customerName,
        customer_id: customerId || undefined,
        notes,
        items: validLines.map(l => ({ product_id: parseInt(l.product_id), quantity: parseInt(l.quantity) })),
      });
      setSuccess(res.data.order);
      setLines([EMPTY_LINE(), EMPTY_LINE()]);
      setCustomerName(""); setCustomerId(""); setNotes("");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create bulk order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSV = (e) => {
    setCsvError(""); setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = ev.target.result.trim().split("\n").slice(1);
        const parsed = rows.map((row, i) => {
          const cols = row.split(",").map(c => c.trim());
          const product_id = cols[0];
          const quantity = parseInt(cols[1]) || 1;
          const p = productMap[product_id];
          return { product_id, quantity, price: p?.price || 0, name: p?.name || `Unknown (${product_id})`, error: !p ? "Product not found" : quantity > p.stock ? `Only ${p.stock} in stock` : "" };
        });
        setLines(parsed.length > 0 ? parsed : [EMPTY_LINE()]);
      } catch {
        setCsvError("Invalid CSV format. Expected columns: product_id, quantity");
      }
    };
    reader.readAsText(file);
    fileRef.current.value = "";
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bulk-portal">
      <div className="bulk-header">
        <div>
          <h1><FaShoppingBag /> Bulk Order Portal</h1>
          <p>Place large institutional orders with spreadsheet-style line entry or CSV upload</p>
        </div>
      </div>

      {success && (
        <div className="bulk-success card">
          <FaCheckCircle className="success-icon" />
          <div>
            <strong>Order #{success.order_id} created successfully!</strong>
            <p>Total: ₹{success.amount?.toLocaleString("en-IN")} · {success.quantity} items · Status: {success.status}</p>
          </div>
          <button className="btn-secondary" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      <div className="bulk-form card">
        <h2>Order Details</h2>
        <div className="bulk-meta-row">
          <div className="form-group">
            <label>Customer Name *</label>
            <div className="combo-input">
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Apollo Hospital" />
              <select value={customerId} onChange={e => {
                const c = customers.find(x => String(x.customer_id) === e.target.value);
                setCustomerId(e.target.value);
                if (c) setCustomerName(c.name);
              }}>
                <option value="">Or select existing...</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, reference number..." />
          </div>
        </div>

        <div className="bulk-csv-row">
          <label className="csv-label">
            <FaFileUpload /> Upload CSV
            <input type="file" accept=".csv" ref={fileRef} onChange={handleCSV} style={{ display: "none" }} />
          </label>
          <span className="csv-hint">CSV format: product_id, quantity (first row as header)</span>
          {csvError && <span className="csv-error"><FaExclamationTriangle /> {csvError}</span>}
        </div>

        <div className="line-table">
          <div className="line-header">
            <span>#</span>
            <span>Product</span>
            <span>Unit Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
            <span>Status</span>
            <span></span>
          </div>
          {lines.map((line, idx) => {
            const p = productMap[line.product_id];
            const subtotal = p ? p.price * (parseInt(line.quantity) || 0) : 0;
            return (
              <div key={idx} className={`line-row ${line.error ? "line-error" : ""}`}>
                <span className="line-num">{idx + 1}</span>
                <select value={line.product_id} onChange={e => updateLine(idx, "product_id", e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
                <span className="line-price">{p ? `₹${p.price}` : "—"}</span>
                <input type="number" min="1" value={line.quantity}
                  onChange={e => updateLine(idx, "quantity", parseInt(e.target.value) || 1)} />
                <span className="line-subtotal">{p ? `₹${subtotal.toLocaleString("en-IN")}` : "—"}</span>
                <span className="line-status">
                  {line.error
                    ? <span className="err-pill"><FaExclamationTriangle /> {line.error}</span>
                    : line.product_id
                    ? <span className="ok-pill"><FaCheckCircle /> OK</span>
                    : <span className="empty-pill">—</span>}
                </span>
                <button className="icon-btn delete" onClick={() => removeLine(idx)} disabled={lines.length <= 1}><FaTrash /></button>
              </div>
            );
          })}
        </div>

        <div className="line-footer">
          <button className="btn-secondary" onClick={addLine}><FaPlus /> Add Line</button>
          <div className="bulk-total-row">
            <span>Total ({validLines.length} items)</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="bulk-submit-row">
          <div className="bulk-summary">
            <span>{validLines.length} valid line(s)</span>
            {lines.some(l => l.error) && <span className="warn-text"><FaExclamationTriangle /> Fix errors before submitting</span>}
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting || validLines.length === 0 || lines.some(l => l.error)}>
            {submitting ? "Placing Order..." : "Place Bulk Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkOrderPortal;
