import { FaBell, FaShoppingCart, FaExclamationTriangle, FaCreditCard } from 'react-icons/fa';
import { formatDateTime } from '../utils/helpers';

const typeIcons = {
  order: <FaShoppingCart />,
  stock: <FaExclamationTriangle />,
  payment: <FaCreditCard />,
  system: <FaBell />,
};

const typeColors = {
  order: '#3b82f6',
  stock: '#f59e0b',
  payment: '#10b981',
  system: '#8b5cf6',
};

function NotificationCard({ notification, onMarkRead, onDelete }) {
  const icon = typeIcons[notification.type] || <FaBell />;
  const color = typeColors[notification.type] || '#64748b';

  return (
    <div className={`notification-card ${!notification.is_read ? 'unread' : ''}`}>
      <div className="notif-icon" style={{ background: color + '20', color }}>
        {icon}
      </div>
      <div className="notif-content">
        <h4>{notification.title}</h4>
        {notification.message && <p>{notification.message}</p>}
        <span className="notif-date">{formatDateTime(notification.created_at)}</span>
      </div>
      <div className="notif-actions">
        {!notification.is_read && (
          <button className="notif-btn" onClick={() => onMarkRead && onMarkRead(notification.notification_id)}>
            Mark Read
          </button>
        )}
        <button className="notif-btn delete" onClick={() => onDelete && onDelete(notification.notification_id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default NotificationCard;
