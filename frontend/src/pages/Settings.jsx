import { useEffect, useState } from "react";
import AlertCard from "../components/AlertCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { getSettings, updateSettings, updateLoginNotificationPrefs } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Settings.css";

function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    loginNotificationEmails: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const response = await getSettings();
        setSettings(response.data);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateSettings(settings);
      
      // Also update login notification preferences separately
      try {
        await updateLoginNotificationPrefs(settings.loginNotificationEmails);
      } catch (notifErr) {
        console.warn("Could not update login notification prefs:", notifErr);
      }
      
      alert(response.data.message || "Settings saved successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your application preferences and account settings.</p>
      </div>

      <AlertCard
        title="Settings Information"
        message="Changes made here will affect the entire system."
        type="info"
      />

      <div className="settings-container">
        {/* Company Details */}
        <div className="settings-card">
          <h2>Company Information</h2>

          <div className="input-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Address</label>
            <textarea
              rows="3"
              name="address"
              value={settings.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-card">
          <h2>Preferences</h2>

          <div className="toggle-item">
            <span>Dark Mode</span>
            <input
              type="checkbox"
              name="darkMode"
              checked={settings.darkMode}
              onChange={handleChange}
            />
          </div>

          <div className="toggle-item">
            <span>Email Notifications</span>
            <input
              type="checkbox"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleChange}
            />
          </div>

          <div className="toggle-item">
            <span>SMS Notifications</span>
            <input
              type="checkbox"
              name="smsNotifications"
              checked={settings.smsNotifications}
              onChange={handleChange}
            />
          </div>

          <div className="settings-card-subsection">
            <h3>🔔 Login Notification Emails</h3>
            <p className="settings-help-text">
              Receive an email alert every time your account is used to sign in.
              This helps you detect unauthorized access to your account.
            </p>

            <div className="toggle-item">
              <div className="toggle-item-text">
                <span>Send login notification emails</span>
                <span className="toggle-item-desc">
                  Emails include login time, device info, IP address, and a
                  security warning.
                </span>
              </div>
              <input
                type="checkbox"
                name="loginNotificationEmails"
                checked={settings.loginNotificationEmails}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

export default Settings;