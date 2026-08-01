import { useEffect, useState } from "react";
import {
  FaBook,
  FaEdit,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";

import "../../styles/courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);

  // Get all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/courses");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load courses"
        );
      }

      setCourses(data.courses);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Clear the form
  const clearForm = () => {
    setCourseName("");
    setCourseCode("");
    setDepartment("");
    setLevel("");
    setEditingId(null);
  };

  // Add or update a course
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      const courseData = {
        courseName,
        courseCode,
        department,
        level,
      };

      const url = editingId
        ? `/api/courses/${editingId}`
        : "/api/courses";

      const method = editingId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to save course"
        );
      }

      setMessage(
        editingId
          ? "Course updated successfully."
          : "Course added successfully."
      );

      clearForm();

      fetchCourses();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Put a course into the form for editing
  const handleEdit = (course) => {
    setCourseName(course.courseName);
    setCourseCode(course.courseCode);
    setDepartment(course.department);
    setLevel(course.level);

    setEditingId(course._id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete a course
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/courses/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to delete course"
        );
      }

      setMessage(
        "Course deleted successfully."
      );

      fetchCourses();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <DashboardLayout
      title="Manage Courses"
      role="admin"
    >
      <PageHeader
        title="Manage Courses"
        subtitle="Add, edit, and manage courses in the system."
      />

      {message && (
        <div className="course-message">
          {message}
        </div>
      )}

      <div className="courses-grid">

        {/* Add or edit course form */}

        <div className="course-form-card">

          <div className="course-title">

            <FaBook />

            <h2>
              {editingId
                ? "Edit Course"
                : "Add New Course"}
            </h2>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>
                Course Name
              </label>

              <input
                type="text"
                placeholder="Example: Web Technology"
                value={courseName}
                onChange={(e) =>
                  setCourseName(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Course Code
              </label>

              <input
                type="text"
                placeholder="Example: CST 401"
                value={courseCode}
                onChange={(e) =>
                  setCourseCode(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Department
              </label>

              <input
                type="text"
                placeholder="Example: Computer Science"
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Level
              </label>

              <select
                value={level}
                onChange={(e) =>
                  setLevel(
                    e.target.value
                  )
                }
                required
              >

                <option value="">
                  Select level
                </option>

                <option value="100">
                  Level 100
                </option>

                <option value="200">
                  Level 200
                </option>

                <option value="300">
                  Level 300
                </option>

                <option value="400">
                  Level 400
                </option>

              </select>

            </div>

            <div className="course-buttons">

              <button
                type="submit"
                className="add-course-btn"
              >

                <FaPlus />

                {editingId
                  ? "Update Course"
                  : "Add Course"}

              </button>

              {editingId && (

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={clearForm}
                >

                  Cancel

                </button>

              )}

            </div>

          </form>

        </div>

        {/* Courses table */}

        <div className="courses-table-card">

          <h2>
            All Courses
          </h2>

          {courses.length === 0 ? (

            <div className="no-courses">

              <FaBook />

              <h3>
                No courses available
              </h3>

              <p>
                Add the first course
                using the form.
              </p>

            </div>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Course
                    </th>

                    <th>
                      Code
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Level
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {courses.map(
                    (course) => (

                      <tr
                        key={course._id}
                      >

                        <td>
                          {course.courseName}
                        </td>

                        <td>
                          {course.courseCode}
                        </td>

                        <td>
                          {course.department}
                        </td>

                        <td>
                          {course.level}
                        </td>

                        <td>

                          <button
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                course
                              )
                            }
                          >

                            <FaEdit />

                          </button>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                course._id
                              )
                            }
                          >

                            <FaTrash />

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Courses;