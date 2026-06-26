import "./StatisticsCard.css";

function StatisticsCard({
  title,
  value,
  icon,
  color = "#2563eb",
  percentage,
  subtitle,
}) {
  return (
    <div className="statistics-card">

      <div
        className="statistics-icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      <div className="statistics-content">
        <h4>{title}</h4>

        <h2>{value}</h2>

        {percentage && (
          <p className="statistics-percentage">
            {percentage}
          </p>
        )}

        {subtitle && (
          <span className="statistics-subtitle">
            {subtitle}
          </span>
        )}
      </div>

    </div>
  );
}

export default StatisticsCard;