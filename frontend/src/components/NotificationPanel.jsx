import "./NotificationPanel.css";

function NotificationPanel({ notifications }) {
  return (
    <div className="notification-panel">

      <div className="notification-header">
        <h2>Notifications</h2>
      </div>

      <div className="notification-list">

        {notifications.length === 0 ? (
          <p className="no-notification">
            No notifications available.
          </p>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification-card ${notification.type}`}
              key={notification.id}
            >
              <div className="notification-content">
                <h4>{notification.title}</h4>

                <p>{notification.message}</p>

                <span>{notification.time}</span>
              </div>
            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default NotificationPanel;