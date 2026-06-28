import { useState, useEffect } from "react";
import axios from "axios";
import { changeUserPassword, getUserProfile, API_BASE_URL } from "../services/api";
import "./SecuritySettings.css";

function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailFor2FA, setEmailFor2FA] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [tfaLoading, setTfaLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  
  const [tfaMessage, setTfaMessage] = useState({ text: "", type: "" });
  const [passMessage, setPassMessage] = useState({ text: "", type: "" });

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsMessage, setSessionsMessage] = useState({ text: "", type: "" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const [downloadLoading, setDownloadLoading] = useState(false);

  // 2FA confirmation modal state
  const [showTfaConfirmModal, setShowTfaConfirmModal] = useState(false);
  const [tfaAction, setTfaAction] = useState(null); // 'enable' or 'disable'

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user.accessToken || user.token;
      
      const response = await axios.get(`${API_BASE_URL}/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
    } catch (err) {
      console.error("Failed to load active sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch current user details to check if 2FA is active and load sessions
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile();
        setTwoFactor(!!response.data.two_factor_enabled);
        setEmailFor2FA(response.data.email || "");
      } catch (err) {
        console.error("Failed to load user security details:", err);
      }
    };
    fetchProfile();
    fetchSessions();
  }, []);

  // ======================
  // 2FA Toggle with Confirmation
  // ======================

  const handleToggleClick = () => {
    // Show confirmation modal first
    setTfaAction(twoFactor ? 'disable' : 'enable');
    setShowTfaConfirmModal(true);
    setTfaMessage({ text: "", type: "" });
  };

  const handleTfaConfirm = async () => {
    setShowTfaConfirmModal(false);
    setTfaAction(null);
    // Toggle 2FA directly via the profile update endpoint
    await toggleTwoFactor(tfaAction === 'enable');
  };

  const toggleTwoFactor = async (enable) => {
    setTfaLoading(true);
    setTfaMessage({ text: "", type: "" });
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userData.accessToken || userData.token;
      
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { twoFactorEnabled: enable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTwoFactor(enable);
      setTfaMessage({ 
        text: `Two-Factor Authentication has been ${enable ? 'enabled' : 'disabled'} successfully!`, 
        type: "success" 
      });
      
      // Update local storage with fresh user data
      userData.user = response.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      setTfaMessage({ text: err.response?.data?.message || "Failed to update 2FA settings.", type: "error" });
    } finally {
      setTfaLoading(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowTfaConfirmModal(false);
    setTfaAction(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMessage({ text: "", type: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPassMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    setPassLoading(true);
    try {
      const result = await changeUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPassMessage({ text: result.data.message || "Password changed successfully!", type: "success" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPassMessage({ text: err.response?.data?.message || "Failed to change password. Please verify current password.", type: "error" });
    } finally {
      setPassLoading(false);
    }
  };

  const handleTerminateOthers = async () => {
    setSessionsMessage({ text: "", type: "" });
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user.accessToken || user.token;
      const refreshToken = user.refreshToken;

      await axios.post(
        `${API_BASE_URL}/auth/sessions/terminate-others`,
        { refreshToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSessionsMessage({ text: "Other sessions terminated successfully.", type: "success" });
      fetchSessions();
    } catch (err) {
      setSessionsMessage({ text: err.response?.data?.message || "Failed to terminate other sessions.", type: "error" });
    }
  };

  const handleDownloadData = async () => {
    setDownloadLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user.accessToken || user.token;

      const response = await axios.get(`${API_BASE_URL}/auth/download-data`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_personal_data.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to download personal data: " + (err.response?.data?.message || err.message));
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteMessage("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user.accessToken || user.token;

      await axios.delete(`${API_BASE_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (err) {
      setDeleteMessage(err.response?.data?.message || "Failed to delete account.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="security-settings-container">
      <div className="security-header">
        <h1>Account Security Settings</h1>
        <p>Manage security protocols, passwords, and authorization factors.</p>
      </div>

      <div className="security-grid">
        {/* Two Factor Authentication Card */}
        <div className="security-card tfa-card">
          <div className="tfa-card-header">
            <div className="tfa-icon-wrapper">
              {twoFactor ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <circle cx="12" cy="16" r="1"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
              )}
            </div>
            <div className="tfa-card-info">
              <h2>Two-Factor Authentication (2FA)</h2>
              <p className="card-desc">
                Add an extra layer of security to your account. Each time you log in, you'll receive a secure 6-digit OTP code via email that must be entered to complete the sign-in process.
              </p>
            </div>
          </div>

          {tfaMessage.text && (
            <div className={`security-alert ${tfaMessage.type}`}>
              {tfaMessage.text}
            </div>
          )}

          <div className="tfa-body">
            <div className="tfa-info-cards">
              <div className={`tfa-info-item ${twoFactor ? 'active' : ''}`}>
                <div className="tfa-info-icon">📧</div>
                <div className="tfa-info-text">
                  <strong>Email OTP Delivery</strong>
                  <span>OTP codes sent to <span className="tfa-email-highlight">{emailFor2FA}</span></span>
                </div>
              </div>
              <div className={`tfa-info-item ${twoFactor ? 'active' : ''}`}>
                <div className="tfa-info-icon">⏱️</div>
                <div className="tfa-info-text">
                  <strong>10-Minute Validity</strong>
                  <span>Each OTP code expires after 10 minutes</span>
                </div>
              </div>
              <div className={`tfa-info-item ${twoFactor ? 'active' : ''}`}>
                <div className="tfa-info-icon">🔄</div>
                <div className="tfa-info-text">
                  <strong>Auto-Renewal</strong>
                  <span>Request a new code if the current one expires</span>
                </div>
              </div>
            </div>

            <div className="tfa-toggle-section">
              <div className="tfa-toggle-left">
                <div className="tfa-status-group">
                  <span className="status-label">Status</span>
                  <span className={`status-badge ${twoFactor ? "active" : "inactive"}`}>
                    {twoFactor ? "🔒 Protected" : "⚠️ Not Protected"}
                  </span>
                </div>
                <p className="tfa-hint">
                  {twoFactor 
                    ? "Your account requires an OTP code for every new sign-in." 
                    : "Enable 2FA to require a verification code on every login."}
                </p>
              </div>
              
              <label className="tfa-toggle-switch" aria-label={twoFactor ? "Disable 2FA" : "Enable 2FA"}>
                <input 
                  type="checkbox" 
                  checked={twoFactor}
                  onChange={handleToggleClick}
                  disabled={tfaLoading}
                />
                <span className={`tfa-toggle-slider ${tfaLoading ? 'loading' : ''}`}>
                  {tfaLoading && <span className="tfa-toggle-spinner"></span>}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="security-card">
          <h2>Update Password</h2>
          <p className="card-desc">Ensure your account is protected with a long, randomized password.</p>

          {passMessage.text && (
            <div className={`security-alert ${passMessage.type}`}>
              {passMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <button type="submit" className="save-pass-btn" disabled={passLoading}>
              {passLoading ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Active Sessions Card */}
        <div className="security-card security-full-width-card">
          <h2>Active Logged-In Sessions</h2>
          <p className="card-desc">Monitor your active device sessions on this application.</p>

          {sessionsMessage.text && (
            <div className={`security-alert ${sessionsMessage.type}`}>
              {sessionsMessage.text}
            </div>
          )}

          {sessionsLoading ? (
            <p>Loading active sessions...</p>
          ) : (
            <div className="sessions-table-wrapper">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Browser</th>
                    <th>IP Address</th>
                    <th>Login Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, idx) => (
                    <tr key={idx}>
                      <td>
                        {session.device_name || "Unknown Device"}
                        {session.isCurrent && <span className="current-badge">Current</span>}
                      </td>
                      <td>{session.browser || "Unknown"}</td>
                      <td>{session.ip_address}</td>
                      <td>{new Date(session.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button 
            className="terminate-others-btn"
            onClick={handleTerminateOthers}
            disabled={sessions.length <= 1}
          >
            Log Out from Other Devices
          </button>
        </div>

        {/* Danger Zone Card */}
        <div className="security-card danger-zone-card security-full-width-card">
          <h2>Danger Zone</h2>
          <p className="card-desc">Perform sensitive operations regarding your account visibility and accessibility.</p>

          <div className="danger-actions">
            <button 
              className="download-data-btn"
              onClick={handleDownloadData}
              disabled={downloadLoading}
            >
              {downloadLoading ? "Downloading..." : "📥 Download Personal Data"}
            </button>
            
            <button 
              className="delete-account-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              ⚠️ Delete Account permanently
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Enable Confirmation Modal */}
      {showTfaConfirmModal && (
        <div className="security-modal-overlay" onClick={handleCancelConfirm}>
          <div className="security-modal tfa-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tfa-confirm-icon">
              {tfaAction === 'enable' ? '🔐' : '🔓'}
            </div>
            <h3>
              {tfaAction === 'enable' ? 'Enable Two-Factor Authentication?' : 'Disable Two-Factor Authentication?'}
            </h3>
            {tfaAction === 'enable' ? (
              <>
                <p>
                  Once enabled, every login to your account will require a <strong>6-digit OTP code</strong> sent to your email. 
                  This significantly enhances the security of your account against unauthorized access.
                </p>
                <div className="tfa-confirm-steps">
                  <div className="tfa-step">
                    <span className="tfa-step-num">1</span>
                    <span>Enter your email & password on the login page</span>
                  </div>
                  <div className="tfa-step">
                    <span className="tfa-step-num">2</span>
                    <span>Receive a 6-digit OTP code via email</span>
                  </div>
                  <div className="tfa-step">
                    <span className="tfa-step-num">3</span>
                    <span>Enter the OTP to complete sign-in</span>
                  </div>
                </div>
              </>
            ) : (
              <p>
                Are you sure you want to disable Two-Factor Authentication? 
                Your account will no longer require an OTP code for login, making it less secure.
              </p>
            )}
            <div className="modal-buttons">
              <button 
                className="modal-cancel-btn" 
                onClick={handleCancelConfirm}
              >
                Cancel
              </button>
              <button 
                className={`modal-confirm-btn ${tfaAction === 'enable' ? 'confirm-enable' : 'confirm-disable'}`}
                onClick={handleTfaConfirm}
              >
                {tfaAction === 'enable' ? 'Yes, Enable 2FA' : 'Yes, Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="security-modal-overlay">
          <div className="security-modal">
            <h3>Delete Account Permanently?</h3>
            <p>
              Are you absolutely sure you want to delete your account? This action is irreversible. All of your custom cleaning kits, orders, profile data, and security history logs will be permanently deleted from the database.
            </p>
            {deleteMessage && <div className="security-alert error">{deleteMessage}</div>}
            <div className="modal-buttons">
              <button 
                className="modal-cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="modal-confirm-btn" 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecuritySettings;
