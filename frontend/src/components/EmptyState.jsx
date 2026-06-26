import "./EmptyState.css";

function EmptyState({
  title = "No Data Found",
  message = "Nothing to display."
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;