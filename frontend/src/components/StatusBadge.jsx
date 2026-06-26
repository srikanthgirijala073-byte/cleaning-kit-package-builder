import "./StatusBadge.css";

function StatusBadge({ status }) {
  const badgeClass = {
    Completed: "status-completed",
    Pending: "status-pending",
    Processing: "status-processing",
    Cancelled: "status-cancelled",
    Delivered: "status-delivered",
  }[status] || "status-default";

  return (
    <span className={`status-badge ${badgeClass}`}>
      {status}
    </span>
  );
}

export default StatusBadge;