import "./AlertCard.css";

function AlertCard({
  title,
  message,
  type = "info",
}) {
  const alertClasses = {
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
    info: "alert-info",
  };

  const alertClass = alertClasses[type] || alertClasses.info;

  return (
    <div className={`alert-card ${alertClass}`}>
      <div className="alert-content">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default AlertCard;