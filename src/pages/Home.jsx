
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Background Image */}
      <div className="home-background">
        <img
          src="/src/assets/bui.jpeg"
          alt="Students at Kumasi Technical University"
        />
        <div className="home-background-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="home-content">

        {/* Header */}
        <div className="home-header">
          <div className="home-logo">
            <div className="home-logo-icon">
              <span>✓</span>
            </div>
          </div>

          <div className="home-header-text">
            <h2>QR ATTENDANCE</h2>
            <p>Kumasi Technical University</p>
          </div>

          <div className="home-status">
            <span></span>
            Smart System
          </div>
        </div>

        {/* Welcome */}
        <div className="home-welcome">
          <div className="welcome-badge">
            QR ATTENDANCE MANAGEMENT SYSTEM
          </div>

          <h3>
            Welcome to <span>Smart Attendance</span>
          </h3>

          <p>
            A simple and secure way to manage class attendance using
            modern QR code technology.
          </p>
        </div>

        {/* Buttons */}
        <div className="home-buttons">
          <button
            className="role-btn student-btn"
            onClick={() =>
              navigate("/login", { state: { role: "student" } })
            }
          >
            <div className="role-icon">🎓</div>

            <div className="role-text">
              <strong>Student</strong>
              <small>Mark and view your attendance</small>
            </div>

            <div className="role-arrow">→</div>
          </button>

          <button
            className="role-btn lecturer-btn"
            onClick={() =>
              navigate("/login", { state: { role: "lecturer" } })
            }
          >
            <div className="role-icon">👨‍🏫</div>

            <div className="role-text">
              <strong>Lecturer</strong>
              <small>Manage classes and attendance</small>
            </div>

            <div className="role-arrow">→</div>
          </button>

          <button
            className="role-btn admin-btn"
            onClick={() =>
              navigate("/login", { state: { role: "admin" } })
            }
          >
            <div className="role-icon">⚙️</div>

            <div className="role-text">
              <strong>Administrator</strong>
              <small>Manage the entire system</small>
            </div>

            <div className="role-arrow">→</div>
          </button>
        </div>

        {/* Register */}
        <p className="register-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>
            Register here
          </span>
        </p>

      </div>

      {/* Footer */}
      <div className="home-footer">
        © {new Date().getFullYear()} Kumasi Technical University
      </div>
    </div>
  );
};

export default Home;
