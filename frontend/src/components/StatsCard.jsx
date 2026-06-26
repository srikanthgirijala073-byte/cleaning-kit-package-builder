function StatsCard({ icon, title, value, subtitle, color = '#2563eb', trend }) {
  return (
    <div className="stats-card card glass">
      <div className="stats-icon" style={{ background: color + '20', color }}>
        {icon}
      </div>
      <div className="stats-info">
        <span className="stats-title">{title}</span>
        <h3 className="stats-value">{value}</h3>
        {subtitle && <span className="stats-subtitle">{subtitle}</span>}
        {trend && (
          <span className={`stats-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
