import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import LoadingSpinner from "../components/LoadingSpinner";
import { getNotifications, API_BASE_URL } from "../services/api";
import axios from "axios";
import "./Notifications.css";
import { FaTrash, FaCheck } from "react-icons/fa";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const types = ["success", "warning", "info", "error"];

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      
      const mapped = response.data.map(n => ({
        id: n.notification_id,
        title: n.title,
        message: n.message,
        time: formatDate(n.created_at),
        type: n.type === 'stock' ? 'warning' : n.type === 'order' ? 'success' : 'info',
        isRead: !!n.is_read
      }));

      setNotifications(mapped);
      setFiltered(mapped);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  useEffect(() => {
    let result = notifications;

    if (searchTerm) {
      result = result.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== "All") {
      result = result.filter(n => n.type === selectedType);
    }

    setFiltered(result);
  }, [searchTerm, selectedType, notifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      alert("Notification deleted successfully");
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) + " - " + date.toLocaleDateString("en-IN");
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p>View all system alerts, order updates and important messages.</p>
      </div>

      <div className="notifications-controls">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Search notifications..."
        />

        <FilterBar
          categories={types}
          selectedCategory={selectedType}
          setSelectedCategory={setSelectedType}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="empty-state card glass">
          <p>No notifications available.</p>
        </div>
      ) : (
        <div className="notifications-section notification-list">
          {filtered.map((notification) => (
            <div
              className={`notification-card ${notification.type} ${notification.isRead ? 'read' : ''}`}
              key={notification.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: notification.isRead ? 0.6 : 1 }}
            >
              <div className="notification-content" style={{ flex: 1 }}>
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span>{notification.time}</span>
              </div>
              <div className="notification-actions" style={{ display: 'flex', gap: '10px' }}>
                {!notification.isRead && (
                  <button className="icon-btn success" title="Mark as read" onClick={() => handleMarkAsRead(notification.id)}>
                    <FaCheck />
                  </button>
                )}
                <button className="icon-btn delete" title="Delete notification" onClick={() => handleDelete(notification.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;