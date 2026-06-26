import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import StatisticsCard from "../components/StatisticsCard";
import AlertCard from "../components/AlertCard";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { getInventory, updateInventory } from "../services/api";
import { FaEdit } from "react-icons/fa";
import "./Inventory.css";

import {
  FaBoxes,
  FaWarehouse,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

function Inventory() {
  const statuses = ["In Stock", "Low Stock", "Out of Stock"];
  const [inventory, setInventory] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    stock: "",
    minStock: "",
  });

  const fetchInventoryList = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: selectedStatus === "All" ? "" : selectedStatus,
      };
      
      const response = await getInventory(params);
      setInventory(response.data.inventory);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryList();
  }, [currentPage, searchTerm, selectedStatus]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      stock: item.current_stock,
      minStock: item.minimum_stock,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateInventory(editingItem.inventory_id, {
        current_stock: parseInt(formData.stock),
        minimum_stock: parseInt(formData.minStock),
      });
      alert("Inventory updated successfully!");
      setEditingItem(null);
      fetchInventoryList();
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert(error.response?.data?.message || "Failed to update inventory");
    }
  };

  // Compute aggregated stats
  const lowStockCount = inventory.filter(i => i.status === "Low Stock" || i.status === "Out of Stock").length;
  const inStockCount = inventory.filter(i => i.status === "In Stock").length;

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="inventory-header">
        <h1>Inventory Management</h1>
        <p>Track product stock and warehouse availability.</p>
      </div>

      {/* Statistics Cards */}
      <div className="inventory-stats">
        <StatisticsCard
          title="Total Products"
          value={total}
          icon={<FaBoxes />}
          color="#2563eb"
          percentage=""
          subtitle="Inventory records"
        />

        <StatisticsCard
          title="Warehouse"
          value="5 Locations"
          icon={<FaWarehouse />}
          color="#10b981"
          percentage=""
          subtitle="Storage zones"
        />

        <StatisticsCard
          title="Low Stock"
          value={lowStockCount}
          icon={<FaExclamationTriangle />}
          color="#f59e0b"
          percentage=""
          subtitle="Need replenishment"
        />

        <StatisticsCard
          title="In Stock"
          value={inStockCount}
          icon={<FaCheckCircle />}
          color="#ef4444"
          percentage=""
          subtitle="Ready for sale"
        />
      </div>

      {/* Alert */}
      {lowStockCount > 0 && (
        <div className="inventory-alert">
          <AlertCard
            title="Inventory Warning"
            message={`${lowStockCount} products are currently running low or out of stock. Please restock immediately.`}
            type="warning"
          />
        </div>
      )}

      {/* Search and Filter */}
      <div className="inventory-controls">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={handleSearch}
          placeholder="Search inventory..."
        />

        <FilterBar
          categories={statuses}
          selectedCategory={selectedStatus}
          setSelectedCategory={handleStatusChange}
        />
      </div>

      {/* Inventory Table */}
      {loading ? (
        <LoadingSpinner />
      ) : inventory.length === 0 ? (
        <div className="empty-state">
          <p>No inventory items found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="inventory-table card">
            <table>
              <thead>
                <tr>
                  <th>Inventory ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Min Stock</th>
                  <th>Stock Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const min = item.minimum_stock || 1;
                  const cur = item.current_stock;
                  const max = Math.max(min * 3, cur + 1);
                  const pct = Math.min((cur / max) * 100, 100);
                  const barColor = cur <= 0
                    ? "#ef4444"
                    : cur <= min
                    ? "#f59e0b"
                    : "#10b981";
                  return (
                  <tr key={item.inventory_id}>
                    <td>INV{String(item.inventory_id).padStart(3, '0')}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.minimum_stock}</td>
                    <td>
                      <div className="stock-bar-cell">
                        <span className="stock-bar-value">{cur}</span>
                        <div className="stock-bar-track">
                          <div
                            className="stock-bar-fill"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          item.status === "In Stock"
                            ? "in-stock"
                            : item.status === "Low Stock"
                            ? "low-stock"
                            : "out-stock"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn edit" onClick={() => handleOpenEditModal(item)}>
                        <FaEdit /> Update
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Update Stock Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editingItem ? `Update: ${editingItem.name}` : ""}
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Current Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleFormChange}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Minimum Stock Threshold</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleFormChange}
                required
                min="0"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Inventory;