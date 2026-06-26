import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import HistoryTimeline from "../components/HistoryTimeline";
import NotificationPanel from "../components/NotificationPanel";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { getOrderById, updateOrder, BACKEND_URL } from "../services/api";
import "./DetailPage.css";

function DetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // Status update inputs
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Completed",
    "Cancelled",
  ];

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getOrderById(id);
      
      // Response contains order data along with items and history
      setOrder(response.data);
      setItems(response.data.items || []);
      setHistory(response.data.history || []);
      setNewStatus(response.data.status || "Pending");
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      await updateOrder(id, {
        status: newStatus,
        notes: statusNotes || `Order status updated to '${newStatus}'.`
      });
      
      alert("Order status and timeline updated successfully!");
      setIsStatusModalOpen(false);
      setStatusNotes("");
      
      // Reload order details to refresh the history timeline
      fetchOrderDetails();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="detail-page" style={{ padding: '30px', textAlign: 'center' }}>
        <div className="card glass" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: '#ef4444' }}>Error</h2>
          <p style={{ color: '#64748b', margin: '20px 0' }}>{error}</p>
          <Link to="/orders" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="detail-page" style={{ padding: '30px', textAlign: 'center' }}>
        <div className="card glass" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <h2>Order Not Found</h2>
          <p style={{ color: '#64748b', margin: '20px 0' }}>The requested order ID does not exist.</p>
          <Link to="/orders" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Map database order history to Timeline properties
  const historyData = history.map((h) => ({
    title: `Status: ${h.status}`,
    description: h.notes || "No details provided.",
    date: formatDate(h.created_at),
  }));

  // Generate dynamic system alerts/notifications based on order state
  const notifications = [
    {
      id: 1,
      title: `Order Updated: ${order.status}`,
      message: `Order ORD${String(order.order_id).padStart(3, '0')} has been updated to '${order.status}' status.`,
      time: "Recent Activity",
      type: order.status === "Cancelled" ? "error" : order.status === "Completed" || order.status === "Delivered" ? "success" : "info",
    }
  ];

  return (
    <div className="detail-page">
      <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <Link to="/orders" className="back-link" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
            ← Back to Orders
          </Link>
          <h1>Order Detail: ORD{String(order.order_id).padStart(3, '0')}</h1>
          <p>Package billing records and tracking logs</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => setIsStatusModalOpen(true)}
            style={{ padding: '10px 18px' }}
          >
            Change Status
          </button>
          <button
            className="view-btn"
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            View Invoice
          </button>
        </div>
      </div>

      {/* Main Order Details Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }} className="details-grid-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Order Summary Info */}
          <div className="detail-card">
            <h2>Package Specifications</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span>Customer Client</span>
                <h3>{order.customer_name || "Guest Customer"}</h3>
              </div>

              <div className="detail-item">
                <span>Package Name</span>
                <h3>{order.package_name || "Custom Kit"}</h3>
              </div>

              <div className="detail-item">
                <span>Total Items Qty</span>
                <h3>{order.quantity} units</h3>
              </div>

              <div className="detail-item">
                <span>Payment Amount</span>
                <h3>₹{order.amount}</h3>
              </div>

              <div className="detail-item">
                <span>Current Status</span>
                <StatusBadge status={order.status} />
              </div>

              <div className="detail-item">
                <span>Created Date</span>
                <h3>{formatDate(order.created_at)}</h3>
              </div>
            </div>

            {/* Smart Bundler Details */}
            {(order.facility_type || order.facility_size) && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>⚡ Automated Facility Bundle Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Facility Category:</span>
                    <strong style={{ display: 'block', color: '#1e3a8a' }}>{order.facility_type}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Quantities Scale:</span>
                    <strong style={{ display: 'block', color: '#1e3a8a' }}>{order.facility_size} Facility</strong>
                  </div>
                </div>
                {order.notes && (
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Directives / Notes:</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#334155' }}>{order.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items breakdown Table */}
          <div className="detail-card" style={{ padding: '25px 30px' }}>
            <h2>Products in Package</h2>
            <div style={{ overflowX: 'auto', marginTop: '15px' }}>
              <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', height: '40px' }}>
                    <th style={{ textAlign: 'left', color: '#475569' }}>Product Details</th>
                    <th style={{ textAlign: 'center', color: '#475569' }}>Quantity</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Price Each</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', height: '55px' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.product_image && (
                            <img
                              src={item.product_image.startsWith("http") ? item.product_image : `${BACKEND_URL}${item.product_image}`}
                              alt={item.product_name}
                              style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Item Code: PROD{String(item.product_id).padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.price}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>₹{parseFloat(item.price) * item.quantity}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No products listed inside this order bundle.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Timeline Sidebar column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="section" style={{ margin: 0 }}>
            <HistoryTimeline history={historyData} />
          </div>

          <div className="section" style={{ margin: 0 }}>
            <NotificationPanel notifications={notifications} />
          </div>

        </div>
      </div>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Invoice Details"
      >
        <div style={{ padding: '10px 0' }}>
          <p><strong>Order ID:</strong> ORD{String(order.order_id).padStart(3, '0')}</p>
          <p><strong>Customer:</strong> {order.customer_name}</p>
          <p><strong>Package Type:</strong> {order.package_name}</p>
          {order.facility_type && <p><strong>Facility Configuration:</strong> {order.facility_type} ({order.facility_size})</p>}
          <p><strong>Total Amount billed:</strong> ₹{order.amount}</p>
          <p><strong>Order Status:</strong> {order.status}</p>
          <p><strong>Billed On:</strong> {formatDate(order.created_at)}</p>
          <hr style={{ border: '0', borderTop: '1px dashed #e2e8f0', margin: '15px 0' }} />
          <button 
            className="btn-primary" 
            onClick={() => window.print()} 
            style={{ width: '100%', padding: '10px' }}
          >
            Print Billed Invoice
          </button>
        </div>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Update Status & Track Timeline: ORD${String(order.order_id).padStart(3, '0')}`}
      >
        <form onSubmit={handleStatusUpdateSubmit} className="modal-form">
          <div className="form-group">
            <label>Select New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Change Reason / Notes (Logs in Timeline)</label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="e.g. Received payment, dispatched package via cargo, or cancelled due to out-of-stock."
              rows="3"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={updatingStatus}
            >
              {updatingStatus ? "Saving..." : "Log to History"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DetailPage;