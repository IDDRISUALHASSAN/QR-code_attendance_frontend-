
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";
import API_URL from "../config/api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    indexNumber: "",
    staffId: "",
    department: "",
    level: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          indexNumber: formData.indexNumber,
          staffId: formData.staffId,
          department: formData.department,
          level: formData.level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      // Registration successful, go to verify OTP page
      navigate("/verify-otp", { state: { email: formData.email } });

    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="register-container">

      {/* =========================
          IMAGE / BRANDING PANEL
          ========================= */}
      <div className="register-visual">

        <img
          src="/src/assets/all.webp"
          alt="Students at Kumasi Technical University"
        />

        <div className="register-visual-overlay"></div>

        <div className="register-visual-content">

          <div className="register-brand-icon">
            <span>✓</span>
          </div>

          <p className="register-brand-label">
            QR ATTENDANCE MANAGEMENT SYSTEM
          </p>

          <h2>
            Join the KSTU BTECH
            <br />
            <span>smart attendance</span>
            <br />
            experience.
          </h2>

          <p className="register-visual-description">
            Create your account and enjoy a faster, smarter and
            more convenient way to manage attendance.
          </p>

          <div className="register-benefits">

            <div>
              <span>✓</span>
              Secure account registration
            </div>

            <div>
              <span>✓</span>
              Easy attendance management
            </div>

            <div>
              <span>✓</span>
              QR-powered attendance system
            </div>

          </div>

        </div>

        <div className="register-visual-footer">
          Kumasi Technical University
        </div>

      </div>

      {/* =========================
          REGISTRATION SECTION
          ========================= */}
      <div className="register-form-section">

        <div className="register-form-container">

          {/* Mobile logo */}
          <div className="register-mobile-logo">
            <div className="register-brand-icon">
              <span>✓</span>
            </div>
          </div>

          {/* Heading */}
          <div className="register-heading">

            <span>GET STARTED</span>

            <h3>Create your account</h3>

            <p>
              Fill in the details below to register
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="error-message">
              <span>!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Role */}
            <div className="form-group">

              <label>Register As</label>

              <div className="select-wrapper">

                <span className="input-icon">👤</span>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>

              </div>

            </div>

            {/* Name */}
            <div className="form-group">

              <label>Full Name</label>

              <div className="input-wrapper">

                <span className="input-icon">👤</span>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

            {/* Email */}
            <div className="form-group">

              <label>Email Address</label>

              <div className="input-wrapper">

                <span className="input-icon">✉</span>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

            {/* Department */}
            <div className="form-group">

              <label>Department</label>

              <div className="input-wrapper">

                <span className="input-icon">🏫</span>

                <input
                  type="text"
                  name="department"
                  placeholder="Enter your department"
                  value={formData.department}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* Student fields */}
            {formData.role === "student" && (
              <div className="conditional-fields">

                <div className="form-row">

                  <div className="form-group">

                    <label>Index Number</label>

                    <div className="input-wrapper">

                      <span className="input-icon">#</span>

                      <input
                        type="text"
                        name="indexNumber"
                        placeholder="Index number"
                        value={formData.indexNumber}
                        onChange={handleChange}
                      />

                    </div>

                  </div>

                  <div className="form-group">

                    <label>Level</label>

                    <div className="select-wrapper">

                      <span className="input-icon">🎓</span>

                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                      >
                        <option value="">Select level</option>
                        <option value="100">Level 100</option>
                        <option value="200">Level 200</option>
                        <option value="300">Level 300</option>
                        <option value="400">Level 400</option>
                      </select>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* Staff ID */}
            {(formData.role === "lecturer" ||
              formData.role === "admin") && (
              <div className="form-group">

                <label>Staff ID</label>

                <div className="input-wrapper">

                  <span className="input-icon">🪪</span>

                  <input
                    type="text"
                    name="staffId"
                    placeholder="Enter your staff ID"
                    value={formData.staffId}
                    onChange={handleChange}
                  />

                </div>

              </div>
            )}

            {/* Password */}
            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">

                <span className="input-icon">🔒</span>

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
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
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "◉" : "○"}
                </button>

              </div>

            </div>

            {/* Confirm Password */}
            <div className="form-group">

              <label>Confirm Password</label>

              <div className="input-wrapper">

                <span className="input-icon">🔒</span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? "◉" : "○"}
                </button>

              </div>

            </div>

            {/* Register */}
            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <span className="register-arrow">→</span>
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="register-footer">

            <p>
              Already have an account?{" "}

              <span onClick={() => navigate("/")}>
                Login here
              </span>
            </p>

          </div>

        </div>

        <div className="register-copyright">
          © {new Date().getFullYear()} Kumasi Technical University
        </div>

      </div>

    </div>
  );
};

export default Register;
