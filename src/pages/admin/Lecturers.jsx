import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/adminLecturers.css";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

function Lecturers() {

  const [lecturers, setLecturers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLecturer, setSelectedLecturer] = useState(null);


  useEffect(() => {
    loadLecturers();
  }, []);


  async function loadLecturers() {

    try {

        const response = await fetch("/api/lecturers");
      if (!response.ok) {
        throw new Error("Failed to fetch lecturers");
      }

      const data = await response.json();

      setLecturers(data.lecturers || []);

    } catch (error) {

      console.error(
        "Error loading lecturers:",
        error
      );

      setLecturers([]);

    }

  }


  const filteredLecturers = lecturers.filter(
    (lecturer) =>
      lecturer.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||

      lecturer.staffId
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );


  return (

    <>

      <DashboardLayout
        title="Lecturers"
        role="admin"
      >

        <div className="lecturers-page">

          <div className="page-heading">

            <div>
              <h1>Lecturers</h1>

              <p>
                Manage all registered lecturers.
              </p>
            </div>

          </div>


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

                {filteredLecturers.length > 0 ? (

                  filteredLecturers.map(
                    (lecturer) => (

                      <tr key={lecturer._id}>

                        <td>
                          {lecturer.name}
                        </td>

                        <td>
                          {lecturer.staffId || "N/A"}
                        </td>

                        <td>
                          {lecturer.email}
                        </td>

                        <td>
                          {lecturer.department || "N/A"}
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
                          >
                            <FaEdit />
                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-btn"
                            title="Delete lecturer"
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

        </div>

      </DashboardLayout>


      {/* VIEW LECTURER MODAL */}

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
                  View registered lecturer
                  information
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
                  {selectedLecturer.name || "N/A"}
                </strong>

              </div>


              <div className="info-item">

                <span>Email</span>

                <strong>
                  {selectedLecturer.email || "N/A"}
                </strong>

              </div>


              <div className="info-item">

                <span>Staff ID</span>

                <strong>
                  {selectedLecturer.staffId || "N/A"}
                </strong>

              </div>


              <div className="info-item">

                <span>Department</span>

                <strong>
                  {selectedLecturer.department || "N/A"}
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


              <div className="info-item">

                <span>Role</span>

                <strong>
                  Lecturer
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

    </>

  );

}

export default Lecturers;