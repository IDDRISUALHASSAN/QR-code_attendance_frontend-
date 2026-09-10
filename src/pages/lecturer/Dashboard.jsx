import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaQrcode,
  FaUsers,
  FaClipboardCheck,
  FaChartBar,
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardCard from "../../components/DashboardCard";
import API_URL from "../../config/api";
import "../../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    const getStoredUser = () => {
      try {
        return JSON.parse(localStorage.getItem("user") || "null");
      } catch {
        return null;
      }
    };

    const storedUser = getStoredUser();
    setUser(storedUser);

    const lecturerId = storedUser?.id || storedUser?._id;

    if (!lecturerId) {
      setAssignedCourses([]);
      setLoadingCourses(false);
      setCourseError("Lecturer account information was not found.");
      return;
    }

    async function loadAssignedCourses() {
      try {
        setLoadingCourses(true);
        setCourseError("");

        const response = await fetch(`${API_URL}/api/course-assignments/lecturer/${lecturerId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load assigned courses.");
        }

        const rawAssignments = Array.isArray(data.assignments)
          ? data.assignments
          : Array.isArray(data.courses)
            ? data.courses
            : Array.isArray(data)
              ? data
              : [];

        const normalizedCourses = rawAssignments.map((assignment, index) => {
          const courseData = assignment.course || assignment;

          return {
            id: assignment._id || assignment.id || courseData?._id || `${courseData?.courseCode || "course"}-${index}`,
            assignmentId: assignment._id || assignment.id || courseData?._id || `${courseData?.courseCode || "course"}-${index}`,
            name: courseData?.courseName || courseData?.name || courseData?.title || "Course",
            code: courseData?.courseCode || courseData?.code || "COURSE",
            department: courseData?.department || "",
            level: courseData?.level || assignment.level || "",
            semester: assignment.semester || courseData?.semester || "",
            academicYear: assignment.academicYear || courseData?.academicYear || "",
          };
        });

        setAssignedCourses(normalizedCourses);
      } catch (error) {
        console.error("Error loading assigned courses:", error);
        setAssignedCourses([]);
        setCourseError(error.message || "Unable to load assigned courses.");
      } finally {
        setLoadingCourses(false);
      }
    }

    loadAssignedCourses();
  }, []);

  const courseCountLabel = `${assignedCourses.length} ${assignedCourses.length === 1 ? "Course" : "Courses"}`;

  return (
    <DashboardLayout title="Lecturer Dashboard" role="lecturer">
      <div className="lecturer-dashboard">
        <div className="lecturer-dashboard-header">
          <div className="lecturer-header-content">
            <div className="lecturer-header-icon">
              <FaBookOpen />
            </div>

            <div>
              <span className="lecturer-header-label">LECTURER PORTAL</span>
              <h1>Welcome back, {user?.name || "Lecturer"} 👋</h1>
              <p>
                Manage your assigned courses, generate attendance sessions, and monitor student
                participation.
              </p>
            </div>
          </div>

          <div className="lecturer-system-status">
            <span />
            Account Active
          </div>
        </div>

        <div className="cards lecturer-stat-cards">
          <DashboardCard title="QR Sessions" value="0" icon={<FaQrcode />} color="#2563eb" />
          <DashboardCard title="Students Present" value="0" icon={<FaUsers />} color="#059669" />
          <DashboardCard title="Attendance Records" value="0" icon={<FaClipboardCheck />} color="#d97706" />
          <DashboardCard title="Attendance Rate" value="0%" icon={<FaChartBar />} color="#7c3aed" />
        </div>

        <div className="lecturer-section-heading">
          <div>
            <span>ACADEMIC ASSIGNMENTS</span>
            <h2>My Assigned Courses</h2>
            <p>Courses assigned to you for teaching and attendance management.</p>
          </div>

          <div className="lecturer-course-count">{courseCountLabel}</div>
        </div>

        <div className="lecturer-courses-section">
          {loadingCourses ? (
            <div className="lecturer-empty-courses">
              <div className="lecturer-empty-icon">
                <FaBookOpen />
              </div>

              <h3>Loading Courses...</h3>
              <p>Fetching your assigned courses and course details.</p>
            </div>
          ) : assignedCourses.length > 0 ? (
            <div className="lecturer-course-grid">
              {assignedCourses.map((course) => (
                <div className="lecturer-course-card" key={course.id}>
                  <div className="lecturer-course-top">
                    <div className="lecturer-course-icon">
                      <FaBookOpen />
                    </div>

                    <span className="lecturer-course-code">{course.code}</span>
                  </div>

                  <h3>{course.name}</h3>

                  {(course.department || course.level || course.semester || course.academicYear) && (
                    <div className="lecturer-course-meta">
                      {course.department && <span>{course.department}</span>}
                      {course.level && <span>Level {course.level}</span>}
                      {course.semester && <span>{course.semester}</span>}
                      {course.academicYear && <span>{course.academicYear}</span>}
                    </div>
                  )}

                  <button
                    type="button"
                    className="lecturer-course-action"
                    onClick={() => navigate("/lecturer/start-attendance", { state: { selectedCourse: course.assignmentId } })}
                  >
                    <span>Generate QR</span>
                    <FaArrowRight />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="lecturer-empty-courses">
              <div className="lecturer-empty-icon">
                <FaBookOpen />
              </div>

              <h3>No Assigned Courses</h3>
              <p>
                {courseError || "Courses assigned to you will appear here. Once a course is assigned, you can manage attendance from this dashboard."}
              </p>
            </div>
          )}
        </div>

        <div className="lecturer-section-heading lecturer-attendance-heading">
          <div>
            <span>ATTENDANCE MANAGEMENT</span>
            <h2>Recent Attendance Sessions</h2>
            <p>Monitor attendance sessions generated for your courses.</p>
          </div>
        </div>

        <div className="lecturer-attendance-section">
          <div className="lecturer-empty-attendance">
            <div className="lecturer-empty-attendance-icon">
              <FaClipboardCheck />
            </div>

            <h3>No Attendance Sessions Yet</h3>
            <p>
              Your recent attendance sessions will appear here after you generate a QR attendance
              session.
            </p>

            <div className="lecturer-attendance-hint">
              <FaQrcode />
              <span>Generate a QR code to start recording attendance.</span>
            </div>
          </div>
        </div>

        <div className="lecturer-info-grid">
          <div className="lecturer-info-card">
            <div className="lecturer-info-card-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <span>TODAY</span>
              <h3>Attendance Overview</h3>
              <p>No attendance activity recorded today.</p>
            </div>
          </div>

          <div className="lecturer-info-card">
            <div className="lecturer-info-card-icon">
              <FaClock />
            </div>

            <div>
              <span>SESSION STATUS</span>
              <h3>No Active Session</h3>
              <p>You currently have no active attendance session.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;