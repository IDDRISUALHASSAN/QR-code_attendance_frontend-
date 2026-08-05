import "../styles/dashboard.css";

function DashboardCard({
  title,
  value,
  icon,
  color,
  subtitle,
}) {
  return (
    <div className="dashboard-card">

      <div
        className="card-icon"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      <div className="card-info">

        <h4>{title}</h4>

        <h2>{value}</h2>

        {subtitle && (
          <small>{subtitle}</small>
        )}

      </div>

    </div>
  );
}

export default DashboardCard;