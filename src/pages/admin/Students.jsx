import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/admin.css";
import "../../styles/adminStudents.css";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUsers,
  FaChevronDown,
} from "react-icons/fa";

import API_URL from "../../config/api";



function Students() {
  const [students, setStudents] = useState([]);

  // =========================
  // FILTER STATES
  // =========================
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // Controls whether search suggestions are visible
  const [showSuggestions, setShowSuggestions] = useState(false);

  // =========================
  // MODAL STATES
  // =========================
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // =========================
  // LOAD STUDENTS
  // =========================
  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const response = await fetch(`${API_URL}/api/students`, {
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

  // =========================
  // DEPARTMENTS
  // =========================
  const departments = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.department)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  // =========================
  // LEVELS
  // =========================
  const levels = ["100", "200", "300", "400"];

  // =========================
  // SEARCH SUGGESTIONS
  // =========================
  const searchSuggestions = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return [];
    }

    const suggestions = [];

    students.forEach((student) => {
      const name = student.name || "";
      const indexNumber = student.indexNumber || "";
      const email = student.email || "";
      const department = student.department || "";
      const level = student.level
        ? `Level ${student.level}`
        : "";

      const values = [
        {
          value: name,
          type: "Student",
        },
        {
          value: indexNumber,
          type: "Index Number",
        },
        {
          value: email,
          type: "Email",
        },
        {
          value: department,
          type: "Department",
        },
        {
          value: level,
          type: "Level",
        },
      ];

      values.forEach((item) => {
        if (
          item.value &&
          item.value.toLowerCase().includes(searchText)
        ) {
          suggestions.push(item);
        }
      });
    });

    // Remove duplicate suggestions
    const uniqueSuggestions = suggestions.filter(
      (suggestion, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item.value.toLowerCase() ===
              suggestion.value.toLowerCase() &&
            item.type === suggestion.type
        )
    );

    return uniqueSuggestions.slice(0, 8);
  }, [students, search]);

  // =========================
  // FILTER STUDENTS
  // =========================
  const filteredStudents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentLevel = student.level
  ? `level ${student.level}`.toLowerCase()
  : "";

const rawLevel = student.level
  ? student.level.toString().toLowerCase()
  : "";

const matchesSearch =
  !searchText ||
  student.name?.toLowerCase().includes(searchText) ||
  student.indexNumber?.toLowerCase().includes(searchText) ||
  student.email?.toLowerCase().includes(searchText) ||
  student.department?.toLowerCase().includes(searchText) ||
  studentLevel.includes(searchText) ||
  rawLevel.includes(searchText);

      const matchesDepartment =
        !departmentFilter ||
        student.department === departmentFilter;

      const matchesLevel =
        !levelFilter ||
        student.level?.toString() === levelFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesLevel
      );
    });
  }, [
    students,
    search,
    departmentFilter,
    levelFilter,
  ]);

  // =========================
  // CLEAR FILTERS
  // =========================
  function clearFilters() {
    setSearch("");
    setDepartmentFilter("");
    setLevelFilter("");
    setShowSuggestions(false);
  }

  // =========================
  // SELECT SEARCH SUGGESTION
  // =========================
  function selectSuggestion(suggestion) {
    setSearch(suggestion.value);
    setShowSuggestions(false);
  }

  // =========================
  // EDIT STUDENT
  // =========================
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

      // Update student in table
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student._id === editingStudent._id
            ? data.student
            : student
        )
      );

      // Update selected student if the view modal
      // happens to contain the same student
      if (selectedStudent?._id === editingStudent._id) {
        setSelectedStudent(data.student);
      }

      setEditingStudent(null);

      alert("Student updated successfully.");
    } catch (error) {
      console.error("Edit student error:", error);

      alert(error.message);
    } finally {
      setEditLoading(false);
    }
  }

  // =========================
  // DELETE STUDENT
  // =========================
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

      // Remove deleted student
      setStudents((currentStudents) =>
        currentStudents.filter(
          (item) => item._id !== student._id
        )
      );

      // Close view modal if open
      if (selectedStudent?._id === student._id) {
        setSelectedStudent(null);
      }

      alert("Student deleted successfully.");
    } catch (error) {
      console.error("Delete student error:", error);

      alert(error.message);
    }
  }

  // =========================
  // OPEN EDIT MODAL
  // =========================
  function openEditModal(student) {
    setEditingStudent(student);

    setEditForm({
      name: student.name || "",
      email: student.email || "",
      indexNumber: student.indexNumber || "",
      department: student.department || "",
      level: student.level?.toString() || "",
    });
  }

  // =========================
  // RENDER
  // =========================
  return (
    <>
      <DashboardLayout title="Students" role="admin">

        {/* =========================================
            PAGE HEADER
        ========================================= */}
        <div className="students-page-header">

          <div>
            <h1>Student Management</h1>

            <p>
              View, search, filter and manage all
              registered students.
            </p>
          </div>

          {/* TOTAL STUDENTS */}
          <div className="student-count-card">

            <div className="student-count-icon">
              <FaUsers />
            </div>

            <div>
              <span>Total Students</span>

              <strong>
                {students.length}
              </strong>
            </div>

          </div>

        </div>


        {/* =========================================
            FILTER CARD
        ========================================= */}
        <div className="student-filter-card">

          <div className="filter-title">

            <FaFilter />

            <span>
              Student Filters
            </span>

          </div>


          <div className="student-filters">

            {/* SEARCH */}
            <div className="student-search-wrapper">

              <div className="student-search-box">

                <FaSearch />

                <input
                  type="text"
                  placeholder="Search by name, index number, email, department or level..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (search.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Small delay allows a suggestion click
                    // to complete before hiding the list
                    setTimeout(() => {
                      setShowSuggestions(false);
                    }, 150);
                  }}
                />

              </div>


              {/* LIVE SEARCH SUGGESTIONS */}
              {showSuggestions &&
                search.trim() &&
                searchSuggestions.length > 0 && (

                  <div className="student-search-suggestions">

                    {searchSuggestions.map(
                      (suggestion, index) => (

                        <button
                          type="button"
                          key={`${suggestion.type}-${suggestion.value}-${index}`}
                          className="student-search-suggestion"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() =>
                            selectSuggestion(
                              suggestion
                            )
                          }
                        >

                          <div className="suggestion-icon">

                            {suggestion.type ===
                            "Student" ? (
                              <FaUsers />
                            ) : (
                              <FaSearch />
                            )}

                          </div>

                          <div className="suggestion-content">

                            <strong>
                              {suggestion.value}
                            </strong>

                            <small>
                              {suggestion.type}
                            </small>

                          </div>

                        </button>

                      )
                    )}

                  </div>

                )}

            </div>


            {/* DEPARTMENT FILTER */}
            <div className="student-select-wrapper">

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

              <FaChevronDown />

            </div>


            {/* LEVEL FILTER */}
            <div className="student-select-wrapper">

              <select
                value={levelFilter}
                onChange={(e) =>
                  setLevelFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Levels
                </option>

                {levels.map((level) => (

                  <option
                    key={level}
                    value={level}
                  >
                    Level {level}
                  </option>

                ))}

              </select>

              <FaChevronDown />

            </div>


            {/* CLEAR FILTER */}
            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Clear
            </button>

          </div>


          {/* FILTER RESULT */}
          <div className="filter-result">

            Showing{" "}

            <strong>
              {filteredStudents.length}
            </strong>{" "}

            of{" "}

            <strong>
              {students.length}
            </strong>{" "}

            students

            {(departmentFilter ||
              levelFilter) && (

              <span className="active-filter-text">

                {" "}
                •{" "}

                {departmentFilter &&
                  departmentFilter}

                {departmentFilter &&
                  levelFilter &&
                  " • "}

                {levelFilter &&
                  `Level ${levelFilter}`}

              </span>

            )}

          </div>

        </div>


        {/* =========================================
            STUDENTS TABLE
        ========================================= */}
        <div className="students-table-card">

          <div className="table-responsive">

            <table className="admin-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>Student</th>

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

                  filteredStudents.map(
                    (student, index) => (

                      <tr key={student._id}>

                        {/* NUMBER */}
                        <td className="student-number">
                          {index + 1}
                        </td>


                        {/* STUDENT */}
                        <td>

                          <div className="student-name-cell">

                            <div className="student-avatar">

                              {student.name
                                ?.charAt(0)
                                ?.toUpperCase()}

                            </div>


                            <div>

                              <strong>
                                {student.name ||
                                  "N/A"}
                              </strong>

                              <small>
                                Student
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* INDEX NUMBER */}
                        <td>

                          {student.indexNumber ||
                            "N/A"}

                        </td>


                        {/* EMAIL */}
                        <td>

                          {student.email ||
                            "N/A"}

                        </td>


                        {/* DEPARTMENT */}
                        <td>

                          {student.department ||
                            "N/A"}

                        </td>


                        {/* LEVEL */}
                        <td>

                          {student.level
                            ? `Level ${student.level}`
                            : "N/A"}

                        </td>


                        {/* STATUS */}
                        <td>

                          {student.isVerified ? (

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
                            title="View student"
                            onClick={() =>
                              setSelectedStudent(
                                student
                              )
                            }
                          >
                            <FaEye />
                          </button>


                          {/* EDIT */}
                          <button
                            type="button"
                            className="edit-btn"
                            title="Edit student"
                            onClick={() =>
                              openEditModal(
                                student
                              )
                            }
                          >
                            <FaEdit />
                          </button>


                          {/* DELETE */}
                          <button
                            type="button"
                            className="delete-btn"
                            title="Delete student"
                            onClick={() =>
                              handleDeleteStudent(
                                student
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

                  /* NO STUDENTS */
                  <tr>

                    <td
                      colSpan="8"
                      className="no-students"
                    >

                      <div>

                        <FaUsers />

                        <h3>
                          No students found
                        </h3>

                        <p>
                          Try changing your
                          search or filters.
                        </p>

                      </div>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </DashboardLayout>


      {/* =========================================
          VIEW STUDENT MODAL
      ========================================= */}
      {selectedStudent && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedStudent(null)
          }
        >

          <div
            className="student-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="modal-header">

              <div>

                <h2>
                  Student Details
                </h2>

                <p>
                  Student account information
                </p>

              </div>


              <button
                type="button"
                className="modal-close-icon"
                onClick={() =>
                  setSelectedStudent(null)
                }
              >
                ×
              </button>

            </div>


            {/* STUDENT PROFILE */}
            <div className="student-profile-modal">

              <div className="large-student-avatar">

                {selectedStudent.name
                  ?.charAt(0)
                  ?.toUpperCase()}

              </div>


              <h3>
                {selectedStudent.name ||
                  "Student"}
              </h3>


              <span>
                {selectedStudent.email ||
                  "No email"}
              </span>

            </div>


            {/* STUDENT INFORMATION */}
            <div className="student-info">

              <p>

                <strong>
                  Index Number
                </strong>

                <span>
                  {selectedStudent.indexNumber ||
                    "N/A"}
                </span>

              </p>


              <p>

                <strong>
                  Department
                </strong>

                <span>
                  {selectedStudent.department ||
                    "N/A"}
                </span>

              </p>


              <p>

                <strong>
                  Level
                </strong>

                <span>
                  {selectedStudent.level
                    ? `Level ${selectedStudent.level}`
                    : "N/A"}
                </span>

              </p>


              <p>

                <strong>
                  Status
                </strong>

                <span>

                  {selectedStudent.isVerified
                    ? "Verified"
                    : "Pending"}

                </span>

              </p>

            </div>


            {/* CLOSE */}
            <button
              type="button"
              className="close-modal-btn"
              onClick={() =>
                setSelectedStudent(null)
              }
            >
              Close
            </button>

          </div>

        </div>

      )}


      {/* =========================================
          EDIT STUDENT MODAL
      ========================================= */}
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
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="modal-header">

              <div>

                <h2>
                  Edit Student
                </h2>

                <p>
                  Update student information
                </p>

              </div>


              <button
                type="button"
                className="modal-close-icon"
                disabled={editLoading}
                onClick={() =>
                  setEditingStudent(null)
                }
              >
                ×
              </button>

            </div>


            {/* EDIT FORM */}
            <form
              onSubmit={handleEditSubmit}
            >

              <div className="edit-form">

                {/* NAME */}
                <label>

                  Name

                  <input
                    type="text"
                    value={
                      editForm.name || ""
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                </label>


                {/* EMAIL */}
                <label>

                  Email

                  <input
                    type="email"
                    value={
                      editForm.email || ""
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        email:
                          e.target.value,
                      })
                    }
                    required
                  />

                </label>


                {/* INDEX NUMBER */}
                <label>

                  Index Number

                  <input
                    type="text"
                    value={
                      editForm.indexNumber ||
                      ""
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        indexNumber:
                          e.target.value,
                      })
                    }
                  />

                </label>


                {/* DEPARTMENT */}
                <label>

                  Department

                  <input
                    type="text"
                    value={
                      editForm.department ||
                      ""
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        department:
                          e.target.value,
                      })
                    }
                  />

                </label>


                {/* LEVEL */}
                <label>

                  Level

                  <select
                    value={
                      editForm.level || ""
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        level:
                          e.target.value,
                      })
                    }
                    required
                  >

                    <option value="">
                      Select Level
                    </option>

                    {levels.map((level) => (

                      <option
                        key={level}
                        value={level}
                      >
                        Level {level}
                      </option>

                    ))}

                  </select>

                </label>

              </div>


              {/* EDIT ACTIONS */}
              <div className="edit-actions">

                <button
                  type="button"
                  className="cancel-edit-btn"
                  disabled={editLoading}
                  onClick={() =>
                    setEditingStudent(null)
                  }
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