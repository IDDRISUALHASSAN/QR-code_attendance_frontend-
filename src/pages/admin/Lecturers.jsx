import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import "../../styles/adminLecturers.css";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUsers,
  FaUserTie,
  FaEnvelope,
  FaIdBadge,
  FaBuilding,
  FaTimes,
} from "react-icons/fa";

import API_URL from "../../config/api";

function Lecturers() {
  const [lecturers, setLecturers] = useState([]);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [editingLecturer, setEditingLecturer] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    staffId: "",
    department: "",
  });

  const [editLoading, setEditLoading] = useState(false);

  /*
  ============================================================
  LOAD LECTURERS
  ============================================================
  */

  useEffect(() => {
    loadLecturers();
  }, []);

  async function loadLecturers() {
    try {
      const response = await fetch(`${API_URL}/api/lecturers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lecturers.");
      }

      const data = await response.json();

      setLecturers(data.lecturers || []);
    } catch (error) {
      console.error("Error loading lecturers:", error);

      setLecturers([]);
    }
  }

  /*
  ============================================================
  GET UNIQUE DEPARTMENTS
  ============================================================
  */

  const departments = useMemo(() => {
    return [
      ...new Set(
        lecturers
          .map((lecturer) => lecturer.department)
          .filter(Boolean)
      ),
    ].sort();
  }, [lecturers]);

  /*
  ============================================================
  FILTER LECTURERS
  ============================================================
  */

  const filteredLecturers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return lecturers.filter((lecturer) => {
      const matchesSearch =
        !searchText ||
        lecturer.name
          ?.toLowerCase()
          .includes(searchText) ||
        lecturer.staffId
          ?.toLowerCase()
          .includes(searchText) ||
        lecturer.email
          ?.toLowerCase()
          .includes(searchText) ||
        lecturer.department
          ?.toLowerCase()
          .includes(searchText);

      const matchesDepartment =
        !departmentFilter ||
        lecturer.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [
    lecturers,
    search,
    departmentFilter,
  ]);

  /*
  ============================================================
  CLEAR FILTERS
  ============================================================
  */

  function clearFilters() {
    setSearch("");
    setDepartmentFilter("");
  }

  /*
  ============================================================
  EDIT LECTURER
  ============================================================
  */

  function openEditModal(lecturer) {
    setEditingLecturer(lecturer);

    setEditForm({
      name: lecturer.name || "",
      email: lecturer.email || "",
      staffId: lecturer.staffId || "",
      department: lecturer.department || "",
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();

    try {
      setEditLoading(true);

      const response = await fetch(
        `${API_URL}/api/lecturers/${editingLecturer._id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },

          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update lecturer."
        );
      }

      /*
      Update lecturer directly in the table
      */

      setLecturers((currentLecturers) =>
        currentLecturers.map((lecturer) =>
          lecturer._id === editingLecturer._id
            ? data.lecturer
            : lecturer
        )
      );

      setEditingLecturer(null);

      alert("Lecturer updated successfully.");
    } catch (error) {
      console.error(
        "Edit lecturer error:",
        error
      );

      alert(error.message);
    } finally {
      setEditLoading(false);
    }
  }

  /*
  ============================================================
  DELETE LECTURER
  ============================================================
  */

  async function handleDeleteLecturer(lecturer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${lecturer.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/lecturers/${lecturer._id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete lecturer."
        );
      }

      /*
      Remove lecturer from table
      */

      setLecturers((currentLecturers) =>
        currentLecturers.filter(
          (item) =>
            item._id !== lecturer._id
        )
      );

      /*
      Close view modal if open
      */

      if (
        selectedLecturer?._id ===
        lecturer._id
      ) {
        setSelectedLecturer(null);
      }

      alert("Lecturer deleted successfully.");
    } catch (error) {
      console.error(
        "Delete lecturer error:",
        error
      );

      alert(error.message);
    }
  }

  /*
  ============================================================
  AVATAR LETTER
  ============================================================
  */

  function getInitial(name) {
    return (
      name?.charAt(0)?.toUpperCase() || "L"
    );
  }

  /*
  ============================================================
  PAGE
  ============================================================
  */

  return (
    <>
      <DashboardLayout
        title="Lecturers"
        role="admin"
      >
        <div className="lecturers-page">

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <div className="lecturers-page-header">

            <div className="lecturers-heading">

              <div className="heading-icon">
                <FaUserTie />
              </div>

              <div>
                <h1>
                  Lecturer Management
                </h1>

                <p>
                  View, search, filter and
                  manage all registered
                  lecturers.
                </p>
              </div>

            </div>

            {/* TOTAL COUNT */}

            <div className="lecturer-count-card">

              <div className="lecturer-count-icon">
                <FaUsers />
              </div>

              <div className="lecturer-count-content">

                <span>
                  Total Lecturers
                </span>

                <strong>
                  {filteredLecturers.length}
                </strong>

              </div>

            </div>

          </div>

          {/* ==================================================
              FILTER CARD
          ================================================== */}

          <div className="lecturer-filter-card">

            <div className="filter-title">

              <FaFilter />

              <span>
                Lecturer Filters
              </span>

            </div>

            <div className="lecturer-filters">

              {/* SEARCH */}

              <div className="lecturer-search-box">

                <FaSearch />

                <input
                  type="text"
                  placeholder="Search by name, staff ID, email or department..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>

              {/* DEPARTMENT */}

              <select
                value={departmentFilter}
                onChange={(e) =>
                  setDepartmentFilter(
                    e.target.value
                  )
                }
              >
                <option value="">
                  All Departments
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}
              </select>

              {/* CLEAR */}

              <button
                type="button"
                className="clear-lecturer-filter-btn"
                onClick={clearFilters}
              >
                <FaTimes />

                Clear Filters
              </button>

            </div>

            {/* RESULT COUNT */}

            <div className="lecturer-filter-result">

              Showing{" "}

              <strong>
                {filteredLecturers.length}
              </strong>{" "}

              of{" "}

              <strong>
                {lecturers.length}
              </strong>{" "}

              lecturers

            </div>

          </div>

          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="lecturers-table-card">

            <div className="table-top-bar">

              <div>
                <h2>
                  All Lecturers
                </h2>

                <p>
                  Lecturer accounts
                </p>
              </div>

              <div className="table-total">

                <FaUsers />

                {filteredLecturers.length}

              </div>

            </div>

            <div className="table-responsive">

              <table className="admin-lecturers-table">

                <thead>

                  <tr>

                    <th>#</th>

                    <th>
                      Lecturer
                    </th>

                    <th>
                      Staff ID
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredLecturers.length >
                  0 ? (

                    filteredLecturers.map(
                      (
                        lecturer,
                        index
                      ) => (

                        <tr
                          key={
                            lecturer._id
                          }
                        >

                          {/* NUMBER */}

                          <td className="lecturer-number">
                            {index + 1}
                          </td>

                          {/* LECTURER */}

                          <td>

                            <div className="lecturer-name-cell">

                              <div className="lecturer-avatar">
                                {getInitial(
                                  lecturer.name
                                )}
                              </div>

                              <div className="lecturer-name-info">

                                <strong>
                                  {
                                    lecturer.name
                                  }
                                </strong>

                                <small>
                                  Lecturer
                                </small>

                              </div>

                            </div>

                          </td>

                          {/* STAFF ID */}

                          <td>

                            <span className="staff-id-badge">

                              <FaIdBadge />

                              {lecturer.staffId ||
                                "N/A"}

                            </span>

                          </td>

                          {/* EMAIL */}

                          <td>

                            <div className="lecturer-email">

                              <FaEnvelope />

                              <span>
                                {
                                  lecturer.email ||
                                  "N/A"
                                }
                              </span>

                            </div>

                          </td>

                          {/* DEPARTMENT */}

                          <td>

                            <span className="department-badge">

                              <FaBuilding />

                              {
                                lecturer.department ||
                                "N/A"
                              }

                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            {lecturer.isVerified ? (

                              <span className="lecturer-status verified">
                                <span className="status-dot"></span>
                                Verified
                              </span>

                            ) : (

                              <span className="lecturer-status pending">
                                <span className="status-dot"></span>
                                Pending
                              </span>

                            )}

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="lecturer-action-buttons">

                              <button
                                type="button"
                                className="lecturer-view-btn"
                                title="View lecturer"
                                onClick={() =>
                                  setSelectedLecturer(
                                    lecturer
                                  )
                                }
                              >
                                <FaEye />
                              </button>

                              <button
                                type="button"
                                className="lecturer-edit-btn"
                                title="Edit lecturer"
                                onClick={() =>
                                  openEditModal(
                                    lecturer
                                  )
                                }
                              >
                                <FaEdit />
                              </button>

                              <button
                                type="button"
                                className="lecturer-delete-btn"
                                title="Delete lecturer"
                                onClick={() =>
                                  handleDeleteLecturer(
                                    lecturer
                                  )
                                }
                              >
                                <FaTrash />
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="7"
                        className="no-lecturers"
                      >

                        <div>

                          <FaUserTie />

                          <h3>
                            No lecturers found
                          </h3>

                          <p>
                            Try changing your
                            search or filter.
                          </p>

                        </div>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </DashboardLayout>

      {/* ======================================================
          VIEW LECTURER MODAL
      ====================================================== */}

      {selectedLecturer && (

        <div
          className="lecturer-modal-overlay"
          onClick={() =>
            setSelectedLecturer(null)
          }
        >

          <div
            className="lecturer-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="lecturer-modal-header">

              <div>

                <h2>
                  Lecturer Details
                </h2>

                <p>
                  Lecturer account
                  information
                </p>

              </div>

              <button
                type="button"
                className="lecturer-modal-close"
                onClick={() =>
                  setSelectedLecturer(null)
                }
              >
                ×
              </button>

            </div>

            {/* PROFILE */}

            <div className="lecturer-modal-profile">

              <div className="large-lecturer-avatar">

                {getInitial(
                  selectedLecturer.name
                )}

              </div>

              <h3>
                {selectedLecturer.name}
              </h3>

              <span>
                {selectedLecturer.email}
              </span>

            </div>

            {/* INFORMATION */}

            <div className="lecturer-details-grid">

              <div className="lecturer-detail-item">

                <div className="detail-icon">
                  <FaUserTie />
                </div>

                <div>

                  <span>
                    Full Name
                  </span>

                  <strong>
                    {
                      selectedLecturer.name ||
                      "N/A"
                    }
                  </strong>

                </div>

              </div>

              <div className="lecturer-detail-item">

                <div className="detail-icon">
                  <FaEnvelope />
                </div>

                <div>

                  <span>
                    Email Address
                  </span>

                  <strong>
                    {
                      selectedLecturer.email ||
                      "N/A"
                    }
                  </strong>

                </div>

              </div>

              <div className="lecturer-detail-item">

                <div className="detail-icon">
                  <FaIdBadge />
                </div>

                <div>

                  <span>
                    Staff ID
                  </span>

                  <strong>
                    {
                      selectedLecturer.staffId ||
                      "N/A"
                    }
                  </strong>

                </div>

              </div>

              <div className="lecturer-detail-item">

                <div className="detail-icon">
                  <FaBuilding />
                </div>

                <div>

                  <span>
                    Department
                  </span>

                  <strong>
                    {
                      selectedLecturer.department ||
                      "N/A"
                    }
                  </strong>

                </div>

              </div>

            </div>

            {/* STATUS */}

            <div className="lecturer-modal-status">

              <span>
                Account Status
              </span>

              {selectedLecturer.isVerified ? (

                <strong className="verified-text">
                  <span></span>
                  Verified
                </strong>

              ) : (

                <strong className="pending-text">
                  <span></span>
                  Pending
                </strong>

              )}

            </div>

            <button
              type="button"
              className="lecturer-close-modal-btn"
              onClick={() =>
                setSelectedLecturer(null)
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

      {/* ======================================================
          EDIT LECTURER MODAL
      ====================================================== */}

      {editingLecturer && (

        <div
          className="lecturer-modal-overlay"
          onClick={() => {

            if (!editLoading) {
              setEditingLecturer(null);
            }

          }}
        >

          <div
            className="lecturer-modal edit-lecturer-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="lecturer-modal-header">

              <div>

                <h2>
                  Edit Lecturer
                </h2>

                <p>
                  Update lecturer
                  information
                </p>

              </div>

              <button
                type="button"
                className="lecturer-modal-close"
                disabled={editLoading}
                onClick={() =>
                  setEditingLecturer(null)
                }
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleEditSubmit}
            >

              <div className="lecturer-edit-form">

                {/* NAME */}

                <label>

                  <span>
                    Full Name
                  </span>

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name:
                          e.target.value,
                      })
                    }
                    placeholder="Enter lecturer name"
                    required
                  />

                </label>

                {/* EMAIL */}

                <label>

                  <span>
                    Email Address
                  </span>

                  <input
                    type="email"
                    value={
                      editForm.email
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        email:
                          e.target.value,
                      })
                    }
                    placeholder="Enter email address"
                    required
                  />

                </label>

                {/* STAFF ID */}

                <label>

                  <span>
                    Staff ID
                  </span>

                  <input
                    type="text"
                    value={
                      editForm.staffId
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        staffId:
                          e.target.value,
                      })
                    }
                    placeholder="Enter staff ID"
                    required
                  />

                </label>

                {/* DEPARTMENT */}

                <label>

                  <span>
                    Department
                  </span>

                  <input
                    type="text"
                    value={
                      editForm.department
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        department:
                          e.target.value,
                      })
                    }
                    placeholder="Enter department"
                  />

                </label>

              </div>

              {/* ACTIONS */}

              <div className="lecturer-edit-actions">

                <button
                  type="button"
                  className="lecturer-cancel-btn"
                  disabled={editLoading}
                  onClick={() =>
                    setEditingLecturer(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="lecturer-save-btn"
                  disabled={editLoading}
                >

                  {editLoading
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </>
  );
}

export default Lecturers;