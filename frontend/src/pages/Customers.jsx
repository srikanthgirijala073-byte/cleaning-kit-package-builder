import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import StatisticsCard from "../components/StatisticsCard";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FaUsers, FaUserCheck, FaBuilding, FaShoppingBag, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import "./Customers.css";

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    type: "Business",
    notes: "",
  });

  const fetchCustomersList = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10, search: searchTerm };
      const response = await getCustomers(params);
      setCustomers(response.data.customers || response.data);
      setTotal(response.data.total || response.data.length || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomersList(); }, [currentPage, searchTerm]);

  const handleSearch = (term) => { setSearchTerm(term); setCurrentPage(1); };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", company: "", address: "", type: "Business", notes: "" });
    setEditingCustomer(null);
  };

  const handleOpenCreate = () => { resetForm(); setShowForm(true); };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
      type: customer.type || "Business",
      notes: customer.notes || "",
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        source: "institutional_crm",
        owner: user?.email || user?.name || "system",
        status: "active",
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.customer_id, payload);
      } else {
        await createCustomer(payload);
      }
      setShowForm(false);
      resetForm();
      fetchCustomersList();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(error.response?.data?.message || "Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteCustomer(id);
      fetchCustomersList();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleOpenDetailModal = (customer) => { setSelectedCustomer(customer); };

  const getHealthScore = (c) => {
    let score = 0;
    if (c.company) score += 30;
    if (c.phone) score += 20;
    if (c.address) score += 15;
    if (c.status === 'active') score += 15;
    if (c.created_at) {
      const days = (new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
      if (days < 90) score += 20;
      else if (days < 365) score += 10;
    }
    return Math.min(score, 100);
  };

  const healthLabel = (score) => {
    if (score >= 75) return { label: "High", cls: "health-high" };
    if (score >= 45) return { label: "Medium", cls: "health-medium" };
    return { label: "Low", cls: "health-low" };
  };

  const formatMemberSince = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const activeCount = customers.length;
  const orgCount = customers.filter(c => c.company).length;

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Institutional CRM</h1>
          <p>Manage B2B customers and their purchase activities</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate} type="button"><FaPlus /> Add Customer</button>
      </div>

      <div className="customers-stats">
        <StatisticsCard title="Total Customers" value={total} icon={<FaUsers />} color="#2563eb" percentage="" subtitle="Customer database" />
        <StatisticsCard title="Active Customers" value={activeCount} icon={<FaUserCheck />} color="#10b981" percentage="" subtitle="Active this period" />
        <StatisticsCard title="Organizations" value={orgCount} icon={<FaBuilding />} color="#f59e0b" percentage="" subtitle="Business clients" />
        <StatisticsCard title="Orders Processed" value="1,250" icon={<FaShoppingBag />} color="#ef4444" percentage="" subtitle="Total orders overall" />
      </div>

      <div className="customers-controls">
        <SearchBar searchTerm={searchTerm} setSearchTerm={handleSearch} placeholder="Search customers by name, email, or company..." />
      </div>

      {loading ? <LoadingSpinner /> : customers.length === 0 ? (
        <div className="empty-state"><p>No customers found matching your search.</p></div>
      ) : (
        <>
          <div className="customers-table card">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Health</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const score = getHealthScore(customer);
                  const { label, cls } = healthLabel(score);
                  return (
                  <tr key={customer.customer_id}>
                    <td>CUST{String(customer.customer_id).padStart(3, '0')}</td>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || 'N/A'}</td>
                    <td>{customer.company || 'Individual'}</td>
                    <td>
                      <div className="health-cell">
                        <div className="health-bar-track">
                          <div
                            className={`health-bar-fill ${cls}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className={`health-label ${cls}`}>{label}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{formatMemberSince(customer.created_at)}</td>
                    <td style={{ display: "flex", gap: "8px" }}>
                      <button className="icon-btn edit" onClick={() => handleOpenDetailModal(customer)}>View</button>
                      <button className="icon-btn edit" onClick={() => handleOpenEdit(customer)}><FaEdit /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(customer.customer_id, customer.name)}><FaTrash /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group"><label>Name *</label><input type="text" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g. Apollo Hospital" /></div>
          <div className="form-row">
            <div className="form-group"><label>Email *</label><input type="email" name="email" value={formData.email} onChange={handleFormChange} required placeholder="contact@apollo.com" /></div>
            <div className="form-group"><label>Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+91 98765 43210" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Company</label><input type="text" name="company" value={formData.company} onChange={handleFormChange} placeholder="e.g. Apollo Group" /></div>
            <div className="form-group"><label>Type</label><select name="type" value={formData.type} onChange={handleFormChange}><option value="Business">Business</option><option value="Individual">Individual</option><option value="Institution">Institution</option></select></div>
          </div>
          <div className="form-group"><label>Address</label><textarea name="address" value={formData.address} onChange={handleFormChange} rows="2" placeholder="Full address..." /></div>
          <div className="form-group"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleFormChange} rows="2" placeholder="Additional notes..." /></div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={selectedCustomer?.name || ""}>
        {selectedCustomer && (
          <div className="customer-detail-view" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p><strong>Customer ID:</strong> CUST{String(selectedCustomer.customer_id).padStart(3, '0')}</p>
            <p><strong>Email:</strong> {selectedCustomer.email}</p>
            <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
            <p><strong>Company:</strong> {selectedCustomer.company || 'None'}</p>
            <p><strong>Address:</strong> {selectedCustomer.address || 'No address provided'}</p>
            <p><strong>Status:</strong> {selectedCustomer.status || 'active'}</p>
            <p><strong>Owner:</strong> {selectedCustomer.owner || 'system'} · Created: {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString("en-IN") : "N/A"}</p>
            <div className="form-actions" style={{ marginTop: '16px' }}><button className="btn-primary" onClick={() => setSelectedCustomer(null)}>Close</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Customers;