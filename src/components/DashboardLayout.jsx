import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function DashboardLayout({
  title,
  role,
  children,
}) {
  return (
    <div className="dashboard-layout">

      <Sidebar role={role} />

      <div className="dashboard-content">

        <Navbar title={title} />

        <div className="dashboard-main">
          {children}
        </div>

      </div>

    </div>
  );
}

export default DashboardLayout;