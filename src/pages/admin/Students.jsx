import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/adminStudents.css";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import API_URL from "../../config/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);



  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
const response = await fetch("${API_URL}/api/students", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();

      setStudents(data.students || []);
    } catch (error) {
      console.error("Error loading students:", error);
      setStudents([]);
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.indexNumber?.toLowerCase().includes(search.toLowerCase())
  );


  async function handleEditSubmit(e) {
  e.preventDefault();

  try {
    setEditLoading(true);

    const response = await fetch(
  `${API_URL}/api/students/${editingStudent._id}`,
  {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, 
    },

    body: JSON.stringify(editForm),
  }
);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update student."
      );
    }

    // Update the student in the table
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student._id === editingStudent._id
          ? data.student
          : student
      )
    );

    setEditingStudent(null);

    alert("Student updated successfully.");

  } catch (error) {

    console.error("Edit student error:", error);

    alert(error.message);

  } finally {

    setEditLoading(false);

  }
}


async function handleDeleteStudent(student) {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${student.name}?`
  );

  if (!confirmed) {
    return;
  }

  try {
   const response = await fetch(
  `${API_URL}/api/students/${student._id}`,
  {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to delete student."
      );
    }

    // Remove the deleted student from the table
    setStudents((currentStudents) =>
      currentStudents.filter(
        (item) => item._id !== student._id
      )
    );

    // Close View modal if this student was being viewed
    if (selectedStudent?._id === student._id) {
      setSelectedStudent(null);
    }

    alert("Student deleted successfully.");

  } catch (error) {
    console.error("Delete student error:", error);

    alert(error.message);
  }
}

  return (
    <>
      <DashboardLayout title="Students" role="admin">
        <h1>Students</h1>
        <p>Manage all registered students.</p>

        <div className="table-header">
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Index Number</th>
              <th>Email</th>
              <th>Department</th>
              <th>Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.indexNumber}</td>
                  <td>{student.email}</td>
                  <td>{student.department}</td>
                  <td>{student.level}</td>

                  <td>
                    {student.isVerified ? (
                      <span className="status-active">Verified</span>
                    ) : (
                      <span className="status-pending">Pending</span>
                    )}
                  </td>

                  <td className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => setSelectedStudent(student)}
                      title="View student"
                    >
                      <FaEye />
                    </button>

                                                <button
                            type="button"
                            className="edit-btn"
                            title="Edit student"
                            onClick={() => {
                                setEditingStudent(student);

                                setEditForm({
                                name: student.name || "",
                                email: student.email || "",
                                indexNumber: student.indexNumber || "",
                                department: student.department || "",
                                level: student.level || "",
                                });
                            }}
                            >
                            <FaEdit />
                            </button>

                                    <button
                type="button"
                className="delete-btn"
                title="Delete student"
                onClick={() => handleDeleteStudent(student)}
                >
                <FaTrash />
                </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-students">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DashboardLayout>

      {selectedStudent && (
        <div className="modal-overlay">
          <div className="student-modal">
            <h2>Student Details</h2>

            <div className="student-info">
              <p>
                <strong>Name:</strong> {selectedStudent.name}
              </p>

              <p>
                <strong>Email:</strong> {selectedStudent.email}
              </p>

              <p>
                <strong>Index Number:</strong>{" "}
                {selectedStudent.indexNumber}
              </p>

              <p>
                <strong>Department:</strong>{" "}
                {selectedStudent.department}
              </p>

              <p>
                <strong>Level:</strong> {selectedStudent.level}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {selectedStudent.isVerified
                  ? "Verified"
                  : "Pending"}
              </p>
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setSelectedStudent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

        ///edit
        {editingStudent && (
  <div
    className="modal-overlay"
    onClick={() => {
      if (!editLoading) {
        setEditingStudent(null);
      }
    }}
  >
    <div
      className="student-modal edit-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="modal-header">

        <div>
          <h2>Edit Student</h2>

          <p>
            Update student information
          </p>
        </div>

        <button
          type="button"
          className="modal-close-icon"
          disabled={editLoading}
          onClick={() => setEditingStudent(null)}
        >
          ×
        </button>

      </div>


      <form onSubmit={handleEditSubmit}>

        <div className="edit-form">

          <label>
            Name

            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  name: e.target.value,
                })
              }
              required
            />
          </label>


          <label>
            Email

            <input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  email: e.target.value,
                })
              }
              required
            />
          </label>


          <label>
            Index Number

            <input
              type="text"
              value={editForm.indexNumber}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  indexNumber: e.target.value,
                })
              }
            />
          </label>


          <label>
            Department

            <input
              type="text"
              value={editForm.department}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  department: e.target.value,
                })
              }
            />
          </label>


          <label>
            Level

            <input
              type="text"
              value={editForm.level}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  level: e.target.value,
                })
              }
            />
          </label>

        </div>


        <div className="edit-actions">

          <button
            type="button"
            className="cancel-edit-btn"
            disabled={editLoading}
            onClick={() => setEditingStudent(null)}
          >
            Cancel
          </button>


          <button
            type="submit"
            className="save-edit-btn"
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

export default Students;