import "../styles/dashboard.css";

function DashboardCard({ title, value, icon, color }) {
  return (
    <div className="dashboard-card">

      <div
        className="card-icon"
        style={{ background: color }}
      >
        {icon}
      </div>

      <div className="card-info">
        <p>{title}</p>
        <h2>{value}</h2>
      </div>

    </div>
  );
}

export default DashboardCard;