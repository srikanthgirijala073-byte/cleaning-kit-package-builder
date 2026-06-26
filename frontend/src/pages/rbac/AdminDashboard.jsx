import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaUserShield, FaPlus, FaTrash } from "react-icons/fa";
import { useRbacAuth } from "../../context/RbacAuthContext";
import DashboardShell from "../../components/rbac/DashboardShell";
import {
  createManager,
  listManagers,
  updateManagerStatus,
  deleteManager,
  createStaff,
  listStaff,
  updateStaffStatus,
  deleteStaff,
} from "../../services/rbacApi";

const emptyManagerForm = { name: "", email: "", password: "", phone: "" };
const emptyStaffForm = { name: "", email: "", password: "", department: "", phone: "" };

function StatusPill({ status }) {
  return (
    <span className={`ops-pill ${status === "active" ? "ops-pill-active" : "ops-pill-inactive"}`}>
      {status}
    </span>
  );
}

function AdminDashboard() {
  const { rbacUser } = useRbacAuth();

  const [managers, setManagers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [managerForm, setManagerForm] = useState(emptyManagerForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [creatingManager, setCreatingManager] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);

  const loadData = async () => {
    setLoadingLists(true);
    try {
      const [mRes, sRes] = await Promise.all([listManagers(), listStaff()]);
      setManagers(mRes.data.managers || []);
      setStaff(sRes.data.staff || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load accounts.");
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setCreatingManager(true);
    try {
      await createManager(managerForm);
      toast.success("Manager created successfully.");
      setManagerForm(emptyManagerForm);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create manager.");
    } finally {
      setCreatingManager(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      await createStaff(staffForm);
      toast.success("Staff created successfully.");
      setStaffForm(emptyStaffForm);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create staff.");
    } finally {
      setCreatingStaff(false);
    }
  };

  const toggleManager = async (m) => {
    const next = m.status === "active" ? "inactive" : "active";
    try {
      await updateManagerStatus(m._id, next);
      toast.success(`Manager set to ${next}.`);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    }
  };

  const toggleStaff = async (s) => {
    const next = s.status === "active" ? "inactive" : "active";
    try {
      await updateStaffStatus(s._id, next);
      toast.success(`Staff set to ${next}.`);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    }
  };

  const removeManager = async (id) => {
    try {
      await deleteManager(id);
      toast.success("Manager removed.");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove manager.");
    }
  };

  const removeStaff = async (id) => {
    try {
      await deleteStaff(id);
      toast.success("Staff removed.");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove staff.");
    }
  };

  return (
    <DashboardShell roleLabel="Admin" accent="#a78bfa" icon={<FaUserShield />}>
      <h1 className="ops-welcome-title">Welcome, Super Admin</h1>
      <p className="ops-welcome-subtitle">
        {rbacUser?.email} · create and manage Manager and Staff accounts below.
      </p>

      {/* Create Manager */}
      <div className="ops-panel">
        <div className="ops-panel-title">Create a Manager account</div>
        <div className="ops-panel-subtitle">
          Managers log in at <span className="ops-mono">/manager/login</span> with the
          credentials you set here.
        </div>
        <form onSubmit={handleCreateManager}>
          <div className="ops-form-grid">
            <div className="ops-field">
              <label className="ops-label">Name</label>
              <input
                className="ops-input"
                value={managerForm.name}
                onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                required
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Email</label>
              <input
                type="email"
                className="ops-input"
                value={managerForm.email}
                onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Password</label>
              <input
                type="password"
                className="ops-input"
                value={managerForm.password}
                onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Phone</label>
              <input
                className="ops-input"
                value={managerForm.phone}
                onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="ops-btn-sm"
            style={{ background: "#a78bfa", marginTop: "6px" }}
            disabled={creatingManager}
          >
            <FaPlus /> {creatingManager ? "Creating..." : "Create Manager"}
          </button>
        </form>
      </div>

      <div className="ops-panel">
        <div className="ops-panel-title">Managers</div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loadingLists && managers.length === 0 && (
                <tr><td colSpan={5} className="ops-empty-row">No managers yet. Create one above.</td></tr>
              )}
              {managers.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || "—"}</td>
                  <td><StatusPill status={m.status} /></td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="ops-btn-sm"
                      style={{ background: "rgba(255,255,255,0.1)", color: "#eaecf2" }}
                      onClick={() => toggleManager(m)}
                    >
                      {m.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="ops-btn-sm"
                      style={{ background: "var(--ops-danger-dim)", color: "var(--ops-danger)" }}
                      onClick={() => removeManager(m._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff */}
      <div className="ops-panel">
        <div className="ops-panel-title">Create a Staff account</div>
        <div className="ops-panel-subtitle">
          Staff log in at <span className="ops-mono">/staff/login</span> with the
          credentials you set here.
        </div>
        <form onSubmit={handleCreateStaff}>
          <div className="ops-form-grid">
            <div className="ops-field">
              <label className="ops-label">Name</label>
              <input
                className="ops-input"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                required
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Email</label>
              <input
                type="email"
                className="ops-input"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                required
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Password</label>
              <input
                type="password"
                className="ops-input"
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Department</label>
              <input
                className="ops-input"
                value={staffForm.department}
                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
              />
            </div>
            <div className="ops-field">
              <label className="ops-label">Phone</label>
              <input
                className="ops-input"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="ops-btn-sm"
            style={{ background: "#f5a524", marginTop: "6px" }}
            disabled={creatingStaff}
          >
            <FaPlus /> {creatingStaff ? "Creating..." : "Create Staff"}
          </button>
        </form>
      </div>

      <div className="ops-panel">
        <div className="ops-panel-title">Staff</div>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loadingLists && staff.length === 0 && (
                <tr><td colSpan={5} className="ops-empty-row">No staff yet. Create one above.</td></tr>
              )}
              {staff.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.department || "—"}</td>
                  <td><StatusPill status={s.status} /></td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="ops-btn-sm"
                      style={{ background: "rgba(255,255,255,0.1)", color: "#eaecf2" }}
                      onClick={() => toggleStaff(s)}
                    >
                      {s.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="ops-btn-sm"
                      style={{ background: "var(--ops-danger-dim)", color: "var(--ops-danger)" }}
                      onClick={() => removeStaff(s._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

export default AdminDashboard;
