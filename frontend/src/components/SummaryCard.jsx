import "./SummaryCard.css";

function SummaryCard({
  title,
  value,
  icon,
  color = "#2563eb",
  subtitle,
}) {
  return (
    <div className="summary-card">
      <div
        className="summary-icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      <div className="summary-content">
        <h4>{title}</h4>
        <h2>{value}</h2>

        {subtitle && (
          <p className="summary-subtitle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default SummaryCard;