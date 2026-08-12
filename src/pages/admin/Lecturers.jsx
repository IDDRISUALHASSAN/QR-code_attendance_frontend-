

import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/adminLecturers.css";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import API_URL from "../../config/api";


function Lecturers() {
  const [lecturers, setLecturers] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [editingLecturer, setEditingLecturer] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    staffId: "",
    department: "",
  });

  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    loadLecturers();
  }, []);

  async function loadLecturers() {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/lecturers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lecturers");
      }

      const data = await response.json();

      setLecturers(data.lecturers || []);

    } catch (error) {
      console.error("Error loading lecturers:", error);
      setLecturers([]);

    } finally {
      setLoading(false);
    }
  }

 
  function handleEdit(lecturer) {
    setEditingLecturer(lecturer);

    setEditForm({
      name: lecturer.name || "",
      email: lecturer.email || "",
      staffId: lecturer.staffId || "",
      department: lecturer.department || "",
    });
  }


  async function updateLecturer() {
    if (!editingLecturer) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/lecturers/${editingLecturer._id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update lecturer"
        );
      }

      await loadLecturers();

      setEditingLecturer(null);

      alert("Lecturer updated successfully.");

    } catch (error) {
      console.error("Error updating lecturer:", error);

      alert(
        error.message || "Failed to update lecturer."
      );
    }
  }

  

  async function deleteLecturer(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lecturer?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/lecturers/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete lecturer"
        );
      }

      await loadLecturers();

     
      if (
        selectedLecturer &&
        selectedLecturer._id === id
      ) {
        setSelectedLecturer(null);
      }

      alert("Lecturer deleted successfully.");

    } catch (error) {
      console.error("Error deleting lecturer:", error);

      alert(
        error.message || "Failed to delete lecturer."
      );
    }
  }

  

  const filteredLecturers = lecturers.filter(
    (lecturer) =>
      lecturer.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      lecturer.staffId
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      lecturer.email
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      lecturer.department
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

 
  return (
    <DashboardLayout
      title="Lecturers"
      role="admin"
    >
      <div className="lecturers-page">

        {/* PAGE HEADER */}

        <div className="page-heading">
          <div>
            <h1>Lecturers</h1>

            <p>
              Manage all registered lecturers.
            </p>
          </div>
        </div>


        {/* SEARCH */}

        <div className="table-header">

          <input
            type="text"
            placeholder="Search lecturer..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        {/* TABLE */}

        <div className="table-container">

          <table className="admin-table">

            <thead>

              <tr>
                <th>Name</th>
                <th>Staff ID</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="no-students"
                  >
                    Loading lecturers...
                  </td>

                </tr>

              ) : filteredLecturers.length > 0 ? (

                filteredLecturers.map(
                  (lecturer) => (

                    <tr
                      key={lecturer._id}
                    >

                      <td>
                        {lecturer.name}
                      </td>


                      <td>
                        {lecturer.staffId ||
                          "N/A"}
                      </td>


                      <td>
                        {lecturer.email}
                      </td>


                      <td>
                        {lecturer.department ||
                          "N/A"}
                      </td>


                      <td>

                        {lecturer.isVerified ? (

                          <span className="status-active">
                            Verified
                          </span>

                        ) : (

                          <span className="status-pending">
                            Pending
                          </span>

                        )}

                      </td>


                      {/* ACTIONS */}

                      <td className="action-buttons">

                        {/* VIEW */}

                        <button
                          type="button"
                          className="view-btn"
                          title="View lecturer"
                          onClick={() =>
                            setSelectedLecturer(
                              lecturer
                            )
                          }
                        >
                          <FaEye />
                        </button>


                        {/* EDIT */}

                        <button
                          type="button"
                          className="edit-btn"
                          title="Edit lecturer"
                          onClick={() =>
                            handleEdit(
                              lecturer
                            )
                          }
                        >
                          <FaEdit />
                        </button>


                        {/* DELETE */}

                        <button
                          type="button"
                          className="delete-btn"
                          title="Delete lecturer"
                          onClick={() =>
                            deleteLecturer(
                              lecturer._id
                            )
                          }
                        >
                          <FaTrash />
                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="no-students"
                  >
                    No lecturers found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {selectedLecturer && (

          <div
            className="modal-overlay"
            onClick={() =>
              setSelectedLecturer(null)
            }
          >

            <div
              className="student-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <h2>
                    Lecturer Details
                  </h2>

                  <p>
                    View lecturer information.
                  </p>

                </div>


                <button
                  type="button"
                  className="modal-close-icon"
                  onClick={() =>
                    setSelectedLecturer(null)
                  }
                >
                  ×
                </button>

              </div>


              <div className="student-info">

                <div className="info-item">

                  <span>Name</span>

                  <strong>
                    {selectedLecturer.name ||
                      "N/A"}
                  </strong>

                </div>


                <div className="info-item">

                  <span>Email</span>

                  <strong>
                    {selectedLecturer.email ||
                      "N/A"}
                  </strong>

                </div>


                <div className="info-item">

                  <span>Staff ID</span>

                  <strong>
                    {selectedLecturer.staffId ||
                      "N/A"}
                  </strong>

                </div>


                <div className="info-item">

                  <span>Department</span>

                  <strong>
                    {selectedLecturer.department ||
                      "N/A"}
                  </strong>

                </div>


                <div className="info-item">

                  <span>Status</span>

                  <strong
                    className={
                      selectedLecturer.isVerified
                        ? "verified-text"
                        : "pending-text"
                    }
                  >
                    {selectedLecturer.isVerified
                      ? "Verified"
                      : "Pending"}
                  </strong>

                </div>

              </div>


              <button
                type="button"
                className="close-modal-btn"
                onClick={() =>
                  setSelectedLecturer(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        )}


        {/* ========================================
            EDIT MODAL
        ======================================== */}

        {editingLecturer && (

          <div
            className="modal-overlay"
            onClick={() =>
              setEditingLecturer(null)
            }
          >

            <div
              className="student-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <h2>
                    Edit Lecturer
                  </h2>

                  <p>
                    Update lecturer information.
                  </p>

                </div>


                <button
                  type="button"
                  className="modal-close-icon"
                  onClick={() =>
                    setEditingLecturer(null)
                  }
                >
                  ×
                </button>

              </div>


              <div className="student-info">

                {/* NAME */}

                <div className="info-item">

                  <span>Name</span>

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter name"
                  />

                </div>


                {/* EMAIL */}

                <div className="info-item">

                  <span>Email</span>

                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email"
                  />

                </div>


                {/* STAFF ID */}

                <div className="info-item">

                  <span>Staff ID</span>

                  <input
                    type="text"
                    value={editForm.staffId}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        staffId: e.target.value,
                      })
                    }
                    placeholder="Enter staff ID"
                  />

                </div>


                {/* DEPARTMENT */}

                <div className="info-item">

                  <span>Department</span>

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

                </div>

              </div>


              <div className="modal-buttons">

                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={updateLecturer}
                >
                  Save Changes
                </button>


                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={() =>
                    setEditingLecturer(null)
                  }
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

export default Lecturers;