// src/pages/Register.jsx
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
      {/* Header */}
      <div className="register-header">
        <h2>QR ATTENDANCE MANAGEMENT SYSTEM</h2>
        <p>Kumasi Technical University</p>
      </div>

      {/* Form */}
      <div className="register-form-container">
        <h3>Create Account</h3>
        <p>Fill in the details below to register</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Role */}
          <div className="form-group">
            <label>Register As</label>
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

          {/* Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Department */}
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              placeholder="Enter your department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          {/* Index Number - only for students */}
          {formData.role === "student" && (
            <>
              <div className="form-group">
                <label>Index Number</label>
                <input
                  type="text"
                  name="indexNumber"
                  placeholder="Enter your index number"
                  value={formData.indexNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Level</label>
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
            </>
          )}

          {/* Staff ID - only for lecturer and admin */}
          {(formData.role === "lecturer" || formData.role === "admin") && (
            <div className="form-group">
              <label>Staff ID</label>
              <input
                type="text"
                name="staffId"
                placeholder="Enter your staff ID"
                value={formData.staffId}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="register-btn"
            disabled={loading}
          >
            {loading ? "Please wait..." : "REGISTER"}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/")}>Login here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;