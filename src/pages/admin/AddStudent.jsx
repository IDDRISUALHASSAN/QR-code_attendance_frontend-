
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import API_URL from "../../config/api";
import "../../styles/adminAddUser.css";

function AddStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    indexNumber: "",
    department: "",
    level: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create student."
        );
      }

      setMessage("Student account created successfully.");

      setForm({
        name: "",
        email: "",
        password: "",
        indexNumber: "",
        department: "",
        level: "",
      });

    } catch (error) {
      console.error("Create student error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Add Student" role="admin">
      <div className="admin-add-user-page">

        <div className="admin-add-user-header">
          <div>
            <span className="admin-page-label">
              STUDENTS
            </span>

            <h1>Add Student</h1>

            <p>
              Create a new student account and add their
              academic information.
            </p>
          </div>
        </div>

        <div className="admin-form-card">

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter student's email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="indexNumber">
                  Index Number
                </label>

                <input
                  id="indexNumber"
                  name="indexNumber"
                  type="text"
                  value={form.indexNumber}
                  onChange={handleChange}
                  placeholder="e.g. 0123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">
                  Department
                </label>

                <input
                  id="department"
                  name="department"
                  type="text"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                />
              </div>

              <div className="form-group">
                <label htmlFor="level">
                  Level
                </label>

                <input
                  id="level"
                  name="level"
                  type="text"
                  value={form.level}
                  onChange={handleChange}
                  placeholder="e.g. 100, 200, 300"
                />
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/admin/students")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Create Student"}
              </button>

            </div>

          </form>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default AddStudent;
