import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <h2>QR ATTENDANCE MANAGEMENT SYSTEM</h2>
        <p>Kumasi Technical University</p>
      </div>

      {/* Welcome */}
      <div className="home-welcome">
        <h3>Welcome</h3>
        <p>Choose how you want to continue</p>
      </div>

      {/* Buttons */}
      <div className="home-buttons">
        <button
          className="role-btn student-btn"
          onClick={() => navigate("/login", { state: { role: "student" } })}
        >
          STUDENT
        </button>

        <button
          className="role-btn lecturer-btn"
          onClick={() => navigate("/login", { state: { role: "lecturer" } })}
        >
          LECTURER
        </button>

        <button
          className="role-btn admin-btn"
          onClick={() => navigate("/login", { state: { role: "admin" } })}
        >
          ADMIN
        </button>
      </div>

      {/* Register link */}
      <p className="register-link">
        Don't have an account?{" "}
        <span onClick={() => navigate("/register")}>Register here</span>
      </p>
    </div>
  );
};

export default Home;