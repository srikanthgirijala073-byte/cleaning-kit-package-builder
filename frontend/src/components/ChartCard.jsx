function ChartCard({ title, children, height = 300 }) {
  return (
    <div className="chart-card card glass">
      <div className="chart-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-body" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

export default ChartCard;
