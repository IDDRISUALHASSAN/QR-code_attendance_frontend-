import Sidebar from "../components/Sidebar";

function DashboardLayout({
  title,
  role,
  children,
}) {
  return (
    <div className="dashboard-layout">

      <Sidebar role={role} />

      <div className="dashboard-content">

        <div className="dashboard-main">
          {children}
        </div>

      </div>

    </div>
  );
}

export default DashboardLayout;