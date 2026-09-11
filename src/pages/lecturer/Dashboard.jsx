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

  // ---------------------------------------------------------
  // ATTENDANCE STATISTICS
  // ---------------------------------------------------------
  const [attendanceStats, setAttendanceStats] = useState({
    qrSessions: 0,
    studentsPresent: 0,
    attendanceRecords: 0,
    attendanceRate: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  // ---------------------------------------------------------
  // LOAD USER + COURSES
  // ---------------------------------------------------------
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

        const response = await fetch(
          `${API_URL}/api/course-assignments/lecturer/${lecturerId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load assigned courses."
          );
        }

        const rawAssignments = Array.isArray(data.assignments)
          ? data.assignments
          : Array.isArray(data.courses)
          ? data.courses
          : Array.isArray(data)
          ? data
          : [];

        const normalizedCourses = rawAssignments.map(
          (assignment, index) => {
            const courseData = assignment.course || assignment;

            return {
              id:
                assignment._id ||
                assignment.id ||
                courseData?._id ||
                `${courseData?.courseCode || "course"}-${index}`,

              assignmentId:
                assignment._id ||
                assignment.id ||
                courseData?._id ||
                `${courseData?.courseCode || "course"}-${index}`,

              name:
                courseData?.courseName ||
                courseData?.name ||
                courseData?.title ||
                "Course",

              code:
                courseData?.courseCode ||
                courseData?.code ||
                "COURSE",

              department: courseData?.department || "",

              level:
                courseData?.level ||
                assignment.level ||
                "",

              semester:
                assignment.semester ||
                courseData?.semester ||
                "",

              academicYear:
                assignment.academicYear ||
                courseData?.academicYear ||
                "",
            };
          }
        );

        setAssignedCourses(normalizedCourses);
      } catch (error) {
        console.error(
          "Error loading assigned courses:",
          error
        );

        setAssignedCourses([]);

        setCourseError(
          error.message ||
            "Unable to load assigned courses."
        );
      } finally {
        setLoadingCourses(false);
      }
    }

    loadAssignedCourses();
  }, []);

  // ---------------------------------------------------------
  // LOAD ATTENDANCE STATISTICS
  // ---------------------------------------------------------
  useEffect(() => {
    const loadAttendanceStatistics = async () => {
      try {
        setLoadingStats(true);

        const storedUser = (() => {
          try {
            return JSON.parse(
              localStorage.getItem("user") || "null"
            );
          } catch {
            return null;
          }
        })();

        const lecturerId =
          storedUser?.id || storedUser?._id;

        if (!lecturerId) {
          setAttendanceStats({
            qrSessions: 0,
            studentsPresent: 0,
            attendanceRecords: 0,
            attendanceRate: 0,
          });

          return;
        }

        const token = localStorage.getItem("token");

        // ---------------------------------------------------
        // Get lecturer attendance sessions
        // ---------------------------------------------------
        const sessionsResponse = await fetch(
          `${API_URL}/api/attendance/lecturer/${lecturerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const sessionsData =
          await sessionsResponse.json();

        if (!sessionsResponse.ok) {
          throw new Error(
            sessionsData.message ||
              "Failed to load attendance sessions."
          );
        }

        const sessions = Array.isArray(
          sessionsData.sessions
        )
          ? sessionsData.sessions
          : [];

        // ---------------------------------------------------
        // QR Sessions
        // ---------------------------------------------------
        const qrSessions = sessions.length;

        // ---------------------------------------------------
        // Attendance Records
        // ---------------------------------------------------
        const attendanceRecords =
          sessions.reduce(
            (total, session) =>
              total + Number(session.totalStudents || 0),
            0
          );

        // ---------------------------------------------------
        // Get individual attendance records
        // to calculate unique students
        // ---------------------------------------------------
        const uniqueStudents = new Set();

        await Promise.all(
          sessions.map(async (session) => {
            try {
              const response = await fetch(
                `${API_URL}/api/attendance/session/${session._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!response.ok) {
                return;
              }

              const data = await response.json();

              const attendance = Array.isArray(
                data.attendance
              )
                ? data.attendance
                : [];

              attendance.forEach((record) => {
                const studentId =
                  record.student?._id ||
                  record.student?.id ||
                  record.student;

                if (studentId) {
                  uniqueStudents.add(
                    String(studentId)
                  );
                }
              });
            } catch (error) {
              console.error(
                `Error loading attendance for session ${session._id}:`,
                error
              );
            }
          })
        );

        // ---------------------------------------------------
        // Attendance Rate
        //
        // Easy and reasonable calculation:
        //
        // Sessions with at least one student present
        // divided by total QR sessions.
        // ---------------------------------------------------
        const sessionsWithAttendance =
          sessions.filter(
            (session) =>
              Number(session.totalStudents || 0) > 0
          ).length;

        const attendanceRate =
          qrSessions > 0
            ? Math.round(
                (sessionsWithAttendance / qrSessions) *
                  100
              )
            : 0;

        setAttendanceStats({
          qrSessions,
          studentsPresent: uniqueStudents.size,
          attendanceRecords,
          attendanceRate,
        });
      } catch (error) {
        console.error(
          "Error loading attendance statistics:",
          error
        );

        setAttendanceStats({
          qrSessions: 0,
          studentsPresent: 0,
          attendanceRecords: 0,
          attendanceRate: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    loadAttendanceStatistics();
  }, []);

  // ---------------------------------------------------------
  // COURSE COUNT
  // ---------------------------------------------------------
  const courseCountLabel = `${assignedCourses.length} ${
    assignedCourses.length === 1
      ? "Course"
      : "Courses"
  }`;

  // ---------------------------------------------------------
  // DISPLAY VALUES
  // ---------------------------------------------------------
  const qrSessionsValue = loadingStats
    ? "..."
    : attendanceStats.qrSessions;

  const studentsPresentValue = loadingStats
    ? "..."
    : attendanceStats.studentsPresent;

  const attendanceRecordsValue = loadingStats
    ? "..."
    : attendanceStats.attendanceRecords;

  const attendanceRateValue = loadingStats
    ? "..."
    : `${attendanceStats.attendanceRate}%`;

  return (
    <DashboardLayout
      title="Lecturer Dashboard"
      role="lecturer"
    >
      <div className="lecturer-dashboard">

        {/* =================================================
            HEADER
        ================================================= */}
        <div className="lecturer-dashboard-header">
          <div className="lecturer-header-content">

            <div className="lecturer-header-icon">
              <FaBookOpen />
            </div>

            <div>
              <span className="lecturer-header-label">
                LECTURER PORTAL
              </span>

              <h1>
                Welcome back,{" "}
                {user?.name || "Lecturer"} 👋
              </h1>

              <p>
                Manage your assigned courses, generate
                attendance sessions, and monitor student
                participation.
              </p>
            </div>
          </div>

          <div className="lecturer-system-status">
            <span />
            Account Active
          </div>
        </div>

        {/* =================================================
            LIVE ATTENDANCE STATISTICS
        ================================================= */}
        <div className="cards lecturer-stat-cards">

          <DashboardCard
            title="QR Sessions"
            value={qrSessionsValue}
            icon={<FaQrcode />}
            color="#2563eb"
          />

          <DashboardCard
            title="Students Present"
            value={studentsPresentValue}
            icon={<FaUsers />}
            color="#059669"
          />

          <DashboardCard
            title="Attendance Records"
            value={attendanceRecordsValue}
            icon={<FaClipboardCheck />}
            color="#d97706"
          />

          <DashboardCard
            title="Attendance Rate"
            value={attendanceRateValue}
            icon={<FaChartBar />}
            color="#7c3aed"
          />

        </div>

        {/* =================================================
            ASSIGNED COURSES
        ================================================= */}
        <div className="lecturer-section-heading">
          <div>
            <span>ACADEMIC ASSIGNMENTS</span>

            <h2>My Assigned Courses</h2>

            <p>
              Courses assigned to you for teaching and
              attendance management.
            </p>
          </div>

          <div className="lecturer-course-count">
            {courseCountLabel}
          </div>
        </div>

        <div className="lecturer-courses-section">

          {loadingCourses ? (

            <div className="lecturer-empty-courses">

              <div className="lecturer-empty-icon">
                <FaBookOpen />
              </div>

              <h3>Loading Courses...</h3>

              <p>
                Fetching your assigned courses and course
                details.
              </p>

            </div>

          ) : assignedCourses.length > 0 ? (

            <div className="lecturer-course-grid">

              {assignedCourses.map((course) => (

                <div
                  className="lecturer-course-card"
                  key={course.id}
                >

                  <div className="lecturer-course-top">

                    <div className="lecturer-course-icon">
                      <FaBookOpen />
                    </div>

                    <span className="lecturer-course-code">
                      {course.code}
                    </span>

                  </div>

                  <h3>{course.name}</h3>

                  {(course.department ||
                    course.level ||
                    course.semester ||
                    course.academicYear) && (

                    <div className="lecturer-course-meta">

                      {course.department && (
                        <span>
                          {course.department}
                        </span>
                      )}

                      {course.level && (
                        <span>
                          Level {course.level}
                        </span>
                      )}

                      {course.semester && (
                        <span>
                          {course.semester}
                        </span>
                      )}

                      {course.academicYear && (
                        <span>
                          {course.academicYear}
                        </span>
                      )}

                    </div>
                  )}

                  <button
                    type="button"
                    className="lecturer-course-action"
                    onClick={() =>
                      navigate(
                        "/lecturer/start-attendance",
                        {
                          state: {
                            selectedCourse:
                              course.assignmentId,
                          },
                        }
                      )
                    }
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
                {courseError ||
                  "Courses assigned to you will appear here. Once a course is assigned, you can manage attendance from this dashboard."}
              </p>

            </div>
          )}

        </div>

        {/* =================================================
            RECENT ATTENDANCE
        ================================================= */}
        <div className="lecturer-section-heading lecturer-attendance-heading">

          <div>
            <span>ATTENDANCE MANAGEMENT</span>

            <h2>Recent Attendance Sessions</h2>

            <p>
              Monitor attendance sessions generated for
              your courses.
            </p>
          </div>

        </div>

        <div className="lecturer-attendance-section">

          <div className="lecturer-empty-attendance">

            <div className="lecturer-empty-attendance-icon">
              <FaClipboardCheck />
            </div>

            <h3>
              {attendanceStats.qrSessions > 0
                ? `${attendanceStats.qrSessions} Attendance ${
                    attendanceStats.qrSessions === 1
                      ? "Session"
                      : "Sessions"
                  } Recorded`
                : "No Attendance Sessions Yet"}
            </h3>

            <p>
              {attendanceStats.qrSessions > 0
                ? "Your attendance activity is being tracked from the sessions you have created."
                : "Your recent attendance sessions will appear here after you generate a QR attendance session."}
            </p>

            <div className="lecturer-attendance-hint">
              <FaQrcode />

              <span>
                Generate a QR code to start recording
                attendance.
              </span>
            </div>

          </div>

        </div>

        {/* =================================================
            INFORMATION CARDS
        ================================================= */}
        <div className="lecturer-info-grid">

          <div className="lecturer-info-card">

            <div className="lecturer-info-card-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <span>TODAY</span>

              <h3>Attendance Overview</h3>

              <p>
                {attendanceStats.qrSessions > 0
                  ? `${attendanceStats.qrSessions} QR session${
                      attendanceStats.qrSessions === 1
                        ? ""
                        : "s"
                    } created in total.`
                  : "No attendance activity recorded yet."}
              </p>
            </div>

          </div>

          <div className="lecturer-info-card">

            <div className="lecturer-info-card-icon">
              <FaClock />
            </div>

            <div>
              <span>SESSION STATUS</span>

              <h3>
                {attendanceStats.qrSessions > 0
                  ? "Attendance System Active"
                  : "No Attendance Activity"}
              </h3>

              <p>
                {attendanceStats.qrSessions > 0
                  ? "Your attendance sessions are being monitored."
                  : "Generate a QR code to start an attendance session."}
              </p>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;