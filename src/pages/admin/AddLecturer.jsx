
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import API_URL from "../../config/api";
import "../../styles/adminAddUser.css";

function AddLecturer() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    staffId: "",
    department: "",
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

      const response = await fetch(`${API_URL}/api/lecturers`, {
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
          data.message || "Failed to create lecturer."
        );
      }

      setMessage("Lecturer account created successfully.");

      setForm({
        name: "",
        email: "",
        password: "",
        staffId: "",
        department: "",
      });

    } catch (error) {
      console.error("Create lecturer error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Add Lecturer" role="admin">
      <div className="admin-add-user-page">

        <div className="admin-add-user-header">
          <div>
            <span className="admin-page-label">
              LECTURERS
            </span>

            <h1>Add Lecturer</h1>

            <p>
              Create a new lecturer account and add their
              staff information.
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
                  placeholder="Enter lecturer's full name"
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
                  placeholder="Enter lecturer's email"
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
                <label htmlFor="staffId">
                  Staff ID
                </label>

                <input
                  id="staffId"
                  name="staffId"
                  type="text"
                  value={form.staffId}
                  onChange={handleChange}
                  placeholder="Enter staff ID"
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

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate("/admin/lecturers")}
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
                  : "Create Lecturer"}
              </button>

            </div>

          </form>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default AddLecturer;