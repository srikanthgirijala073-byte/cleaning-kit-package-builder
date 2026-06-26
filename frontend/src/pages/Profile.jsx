import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile, getAuditLogs, BACKEND_URL } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import "./Profile.css";

function Profile() {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        const response = await getUserProfile();
        setProfile(response.data);
        setName(response.data.name);
        setPhone(response.data.phone || "");
        setAddress(response.data.address || "");
        
        if (response.data.profile_image) {
          setAvatarPreview(response.data.profile_image.startsWith("http") 
            ? response.data.profile_image 
            : `${BACKEND_URL}${response.data.profile_image}`
          );
        } else {
          setAvatarPreview("https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
        }

        // Fetch user audit trail logs
        const auditRes = await getAuditLogs();
        setAuditLogs(auditRes.data || []);
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [authUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("address", address);
      if (avatar) {
        formData.append("profile_image", avatar);
      }

      const response = await updateUserProfile(formData);
      alert(response.data.message || "Profile updated successfully!");
      setProfile(response.data.user);
      
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...savedUser,
        user: response.data.user
      }));

    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Not available";
    return new Date(isoString).toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        
        {/* Profile Card Summary */}
        <div className="profile-card card glass">
          <div className="avatar-wrapper">
            <img
              src={avatarPreview}
              alt="profile"
              className="profile-avatar"
            />
            <label className="avatar-edit-label" htmlFor="profile-avatar-upload">
              📷
              <input id="profile-avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>

          <h2>{profile?.name}</h2>
          <p className="profile-email">{profile?.email}</p>
          
          <span className="badge">
            {profile?.role ? profile.role.toUpperCase() : "CUSTOMER"}
          </span>

          {/* Metadata */}
          <div className="profile-metadata-section">
            <div className="metadata-row">
              <span className="meta-label">Joined:</span>
              <span className="meta-val">{formatDate(profile?.created_at)}</span>
            </div>
            <div className="metadata-row">
              <span className="meta-label">Last Login:</span>
              <span className="meta-val">{formatDate(profile?.last_login)}</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="profile-navigation-links">
            <Link to="/security-settings" className="nav-link-btn">
              🛡️ Security Settings & 2FA
            </Link>
            <Link to="/login-history" className="nav-link-btn">
              📝 View Login History Logs
            </Link>
          </div>

          <button onClick={logout} className="logout-account-btn">
            Logout Account
          </button>
        </div>

        {/* Edit Info Form */}
        <div className="profile-forms">
          <div className="card glass edit-info-card">
            <h3>Personal Profile Details</h3>
            <form onSubmit={handleProfileSubmit} className="profile-edit-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group">
                <label>Shipping Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete shipping address"
                  rows="3"
                  className="address-textarea"
                />
              </div>

              <button type="submit" disabled={updating} className="btn-primary">
                {updating ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>
        </div>

        {/* Security Audit Logs */}
        <div className="profile-audit-section card glass">
          <h3>🛡️ Account Security Audit Trail</h3>
          <p className="audit-subtitle">Immutable chronological logging of sensitive security events on your account.</p>
          
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Event Date & Time</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-date">{formatDate(log.created_at)}</td>
                    <td>
                      <span className={`audit-badge ${log.action.includes("FAILED") || log.action.includes("LOCKED") ? "badge-danger" : "badge-success"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="audit-details">{log.details}</td>
                    <td>
                      <span className="audit-ip">{log.ip_address || "127.0.0.1"}</span>
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="no-audit-logs">No security audit events recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;