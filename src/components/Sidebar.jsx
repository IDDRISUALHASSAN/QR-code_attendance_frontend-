import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaBook, FaUser, FaClipboardList, FaSignOutAlt, FaQrcode } from "react-icons/fa";

import "../styles/side.css";

function Sidebar({ role }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menus = {
    student: [
      { name: "Dashboard", icon: <FaHome />, path: "/student/dashboard" },
      { name: "Scan QR", icon: <FaQrcode />, path: "/student/scan" },
      { name: "Attendance", icon: <FaClipboardList />, path: "/student/history" },
      { name: "Profile", icon: <FaUser />, path: "/student/profile" },
    ],

    lecturer: [
      {name: "Dashboard", icon: <FaHome />, path: "/lecturer/dashboard", },

       {name: "Start Attendance", icon: <FaQrcode />, path: "/lecturer/start-attendance", },

      {name: "Attendance History", icon: <FaClipboardList />, path: "/lecturer/attendance", },
      {name: "Profile", icon: <FaUser />, path: "/lecturer/profile", },
    ],

    admin: [
      { name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
      { name: "Students", icon: <FaUser />, path: "/admin/students" },
      { name: "Lecturers", icon: <FaUser />, path: "/admin/lecturers" },
      { name: "Reports", icon: <FaClipboardList />, path: "/admin/reports" },
      { name: "Courses", icon: <FaBook />, path: "/admin/courses" },
      { name: "Assign Course", icon: <FaBook />, path: "/admin/assign-course" },
    ],
  };

  return (
    <div className="sidebar">

      <div className="logo">
        <h2>QRAMS</h2>
        <p>QR Attendance System</p>
      </div>

      <ul>
        {menus[role].map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? "active-link" : ""
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <button className="logout-btn" onClick={logout}>
        <FaSignOutAlt />
        Logout
      </button>

    </div>
  );
}

export default Sidebar;