import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderCard from "../components/OrderCard";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { getOrders, updateOrder } from "../services/api";
import { exportToCSV } from "../utils/csvExport";
import { FaFileCsv, FaThLarge, FaList } from "react-icons/fa";
import "./Orders.css";

function Orders() {
  const statuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Completed",
    "Cancelled",
  ];

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const handleExportOrders = () => {
    const headers = ["Order ID", "Customer Name", "Package Name", "Quantity", "Amount (₹)", "Status", "Created At"];
    const fields = ["order_id", "customer_name", "package_name", "quantity", "amount", "status", "created_at"];
    
    const exportData = orders.map(o => ({
      ...o,
      order_id: `ORD${String(o.order_id).padStart(3, '0')}`,
      amount: parseFloat(o.amount || 0)
    }));
    
    exportToCSV(exportData, "cleaning_kit_orders.csv", headers, fields);
  };

  const fetchOrdersList = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 6,
        search: searchTerm,
        status: selectedStatus === "All" ? "" : selectedStatus,
        facility_type: selectedType === "All" ? "" : selectedType,
        startDate: startDate,
        endDate: endDate,
      };
      
      const response = await getOrders(params);
      
      // Handle array or object structure
      const fetchedOrders = response.data.orders || response.data || [];
      setOrders(fetchedOrders);
      setTotal(response.data.total || fetchedOrders.length || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, [currentPage, searchTerm, selectedStatus, selectedType, startDate, endDate]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedStatus("All");
    setSelectedType("All");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleOpenStatusModal = (order) => {
    setEditingOrder(order);
    setNewStatus(order.status);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateOrder(editingOrder.order_id, {
        status: newStatus
      });
      alert("Order status updated successfully!");
      setEditingOrder(null);
      fetchOrdersList();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(error.response?.data?.message || "Failed to update order status");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="orders-page">
      <div className="orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Orders Management</h1>
          <p>Track and manage all cleaning kit orders</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            ><FaList /></button>
            <button
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            ><FaThLarge /></button>
          </div>
          <button className="btn-secondary" onClick={handleExportOrders} type="button">
            <FaFileCsv /> Export
          </button>
        </div>
      </div>

      <div className="orders-controls card glass">
        <div className="orders-controls-row">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={handleSearch}
            placeholder="Search customer or package..."
          />

          <div className="filter-group">
            <label className="filter-group-label">Status</label>
            <select
              className="filter-select-inline"
              value={selectedStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group-label">Facility Type</label>
            <select
              className="filter-select-inline"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Types</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Corporate">Corporate</option>
              <option value="Residential">Residential</option>
            </select>
          </div>
        </div>

        <div className="orders-controls-row date-row" style={{ marginTop: '15px' }}>
          <div className="filter-group">
            <label className="filter-group-label">Start Date</label>
            <input
              type="date"
              className="filter-date-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <label className="filter-group-label">End Date</label>
            <input
              type="date"
              className="filter-date-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {(selectedStatus !== "All" || selectedType !== "All" || startDate || endDate || searchTerm) && (
            <button
              className="btn-secondary clear-filters-btn"
              onClick={handleClearFilters}
              type="button"
              style={{ marginLeft: 'auto', alignSelf: 'flex-end', height: '42px', padding: '0 20px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found matching the filter criteria.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="kanban-board">
          {statuses.map(status => {
            const col = orders.filter(o => (o.status || 'Pending') === status);
            const colColors = {
              Pending: '#f59e0b', Processing: '#6366f1', Shipped: '#3b82f6',
              Delivered: '#10b981', Completed: '#059669', Cancelled: '#ef4444',
            };
            return (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header" style={{ borderColor: colColors[status] }}>
                  <span className="kanban-col-dot" style={{ background: colColors[status] }} />
                  <span className="kanban-col-title">{status}</span>
                  <span className="kanban-col-count">{col.length}</span>
                </div>
                <div className="kanban-col-body">
                  {col.length === 0 ? (
                    <div className="kanban-empty">No orders</div>
                  ) : col.map(order => (
                    <div key={order.order_id} className="kanban-card">
                      <div className="kanban-card-id">ORD{String(order.order_id).padStart(3, '0')}</div>
                      <div className="kanban-card-customer">{order.customer_name || 'Guest'}</div>
                      <div className="kanban-card-pkg">{order.package_name || 'Custom Package'}</div>
                      <div className="kanban-card-footer">
                        <span className="kanban-card-amount">₹{parseFloat(order.amount || 0).toLocaleString('en-IN')}</span>
                        <button className="kanban-action-btn" onClick={() => handleOpenStatusModal(order)}>Move</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="orders-grid">
            {orders.map((order) => (
              <div key={order.order_id} className="order-card-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                <OrderCard
                  orderId={`ORD${String(order.order_id).padStart(3, '0')}`}
                  customerName={order.customer_name || 'Guest'}
                  packageName={order.package_name || 'Custom Package'}
                  quantity={order.quantity || 1}
                  amount={parseFloat(order.amount || 0)}
                  status={order.status || 'Pending'}
                  date={formatDate(order.created_at)}
                />
                <div style={{ padding: '0 15px 15px', marginTop: '-10px', display: 'flex', gap: '10px' }}>
                  <Link to={`/details/${order.order_id}`} className="btn-secondary" style={{ flex: 1, padding: '8px', textAlign: 'center', textDecoration: 'none', fontSize: '0.875rem' }}>
                    View Details
                  </Link>
                  <button className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.875rem' }} onClick={() => handleOpenStatusModal(order)}>
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Status Update Modal */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title={editingOrder ? `Update Status: ORD${String(editingOrder.order_id).padStart(3, '0')}` : ""}
      >
        {editingOrder && (
          <form onSubmit={handleUpdateStatusSubmit} className="modal-form">
            <div className="form-group">
              <label>Order Status</label>
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

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditingOrder(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Status
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Orders;