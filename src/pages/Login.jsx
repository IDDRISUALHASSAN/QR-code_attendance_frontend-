
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Login.css";
import API_URL from "../config/api";

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRole = location.state?.role || "Student";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: selectedRole.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // Save login information
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert(data.message);

      // Redirect according to role
      if (data.user.role === "student") {
        navigate("/student/dashboard");
      } else if (data.user.role === "lecturer") {
        navigate("/lecturer/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setError(error.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* =========================
          IMAGE / BRANDING PANEL
          ========================= */}
      <div className="login-visual">

        <img
          src="/src/assets/logo.webp"
          alt="Students at Kumasi Technical University"
        />

        <div className="login-visual-overlay"></div>

        <div className="login-visual-content">

          <div className="login-brand-icon">
            <span>✓</span>
          </div>

          <p className="login-brand-label">
            QR ATTENDANCE MANAGEMENT SYSTEM
          </p>

          <h2>
            Smart attendance.
            <br />
            <span>Simple and secure.</span>
          </h2>

          <p className="login-visual-description">
            Manage class attendance quickly and efficiently using
            modern QR code technology.
          </p>

          <div className="login-feature-list">
            <div>
              <span>✓</span>
              Fast QR attendance
            </div>

            <div>
              <span>✓</span>
              Secure user access
            </div>

            <div>
              <span>✓</span>
              Real-time attendance records
            </div>
          </div>

        </div>

        <div className="login-visual-footer">
          Kumasi Technical University
        </div>

      </div>

      {/* =========================
          LOGIN FORM
          ========================= */}
      <div className="login-form-section">

        <div className="login-card">

          <div className="login-mobile-logo">
            <div className="login-brand-icon">
              <span>✓</span>
            </div>
          </div>

          <div className="login-heading">
            <span>WELCOME BACK</span>

            <h1>Sign in to your account</h1>

            <p>
              Login as{" "}
              <strong>{selectedRole}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="input-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            {/* Password */}
            <div className="input-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "○"}
                </button>

              </div>

            </div>

            {/* Show password */}
            <div className="show-password">

              <input
                type="checkbox"
                id="show"
                checked={showPassword}
                onChange={() =>
                  setShowPassword(!showPassword)
                }
              />

              <label htmlFor="show">
                Show Password
              </label>

            </div>

            {/* Error */}
            {error && (
              <div className="error-message">
                <span>!</span>
                {error}
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="submit-arrow">→</span>
                </>
              )}
            </button>

          </form>

          {/* Links */}
          <div className="bottom-links">

            <Link to="/forgot-password">
              Forgot Password?
            </Link>

            <div className="register-divider">
              <span></span>
              <small>OR</small>
              <span></span>
            </div>

            <p>
              Don't have an account?{" "}

              <Link
                to="/register"
                state={{ role: selectedRole }}
              >
                Create an account
              </Link>
            </p>

          </div>

        </div>

        <div className="login-copyright">
          © {new Date().getFullYear()} Kumasi Technical University
        </div>

      </div>

    </div>
  );
}

export default Login;
