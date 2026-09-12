import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaClipboardCheck,
  FaBook,
  FaCalendarAlt,
  FaUsers,
  FaArrowRight,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaChalkboardTeacher,
  FaTimes,
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";

import "../../styles/Dashboard.css";
import "../../styles/attendanceHistory.css";

function AttendanceHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedDate, setSelectedDate] = useState("");

  const classOptions = [
    "All Classes",
    "Class A",
    "Class B",
    "Class C",
    "Class D",
    "Class E",
  ];

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      setError("");

      const user = JSON.parse(localStorage.getItem("user"));

      if (!user?.id) {
        throw new Error("Lecturer information could not be found.");
      }

      const response = await fetch(
        `${API_URL}/api/attendance/lecturer/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load attendance history."
        );
      }

      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error loading attendance history:", error);
      setError(error.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    if (!date) return "N/A";

    return new Date(date).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusClass(status) {
    if (!status) return "status-default";

    const normalizedStatus = status.toLowerCase();

    if (
      normalizedStatus === "active" ||
      normalizedStatus === "open"
    ) {
      return "status-active";
    }

    if (
      normalizedStatus === "closed" ||
      normalizedStatus === "completed"
    ) {
      return "status-completed";
    }

    if (normalizedStatus === "expired") {
      return "status-expired";
    }

    return "status-default";
  }

  function clearFilters() {
    setSearch("");
    setSelectedClass("All Classes");
    setSelectedStatus("All Status");
    setSelectedDate("");
  }

  const filteredSessions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const courseName =
        session.course?.courseName?.toLowerCase() || "";

      const courseCode =
        session.course?.courseCode?.toLowerCase() || "";

      const className =
        session.className?.toLowerCase() || "";

      const status =
        session.status?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        courseName.includes(searchValue) ||
        courseCode.includes(searchValue) ||
        className.includes(searchValue);

      const matchesClass =
        selectedClass === "All Classes" ||
        session.className === selectedClass;

      const matchesStatus =
        selectedStatus === "All Status" ||
        status === selectedStatus.toLowerCase();

      let matchesDate = true;

      if (selectedDate && session.startTime) {
        const sessionDate = new Date(session.startTime)
          .toISOString()
          .split("T")[0];

        matchesDate = sessionDate === selectedDate;
      }

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    sessions,
    search,
    selectedClass,
    selectedStatus,
    selectedDate,
  ]);

  const totalStudentsRecorded = sessions.reduce(
    (total, session) =>
      total + Number(session.totalStudents || 0),
    0
  );

  const filteredStudentsRecorded = filteredSessions.reduce(
    (total, session) =>
      total + Number(session.totalStudents || 0),
    0
  );

  const uniqueCourses = new Set(
    sessions
      .map(
        (session) =>
          session.course?._id ||
          session.course?.courseCode
      )
      .filter(Boolean)
  ).size;

  const activeSessions = sessions.filter(
    (session) =>
      session.status?.toLowerCase() === "active"
  ).length;

  return (
    <DashboardLayout
      title="Attendance History"
      role="lecturer"
    >
      <div className="attendance-history-page">

        <PageHeader
          title="Attendance History"
          subtitle="Review attendance sessions generated for your assigned courses and classes."
        />

        {/* =========================
            SUMMARY
           ========================= */}

        <div className="attendance-history-summary">

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon blue">
              <FaClipboardCheck />
            </div>

            <div>
              <span>Total Sessions</span>
              <strong>{sessions.length}</strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon green">
              <FaBook />
            </div>

            <div>
              <span>Courses</span>
              <strong>{uniqueCourses}</strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon orange">
              <FaUsers />
            </div>

            <div>
              <span>Students Recorded</span>
              <strong>{totalStudentsRecorded}</strong>
            </div>
          </div>

          <div className="attendance-summary-card">
            <div className="attendance-summary-icon purple">
              <FaChalkboardTeacher />
            </div>

            <div>
              <span>Active Sessions</span>
              <strong>{activeSessions}</strong>
            </div>
          </div>

        </div>

        {/* =========================
            ATTENDANCE SECTION
           ========================= */}

        <div className="attendance-history-section">

          <div className="attendance-history-section-header">

            <div>
              <span className="attendance-section-label">
                ATTENDANCE MANAGEMENT
              </span>

              <h2>Attendance Sessions</h2>

              <p>
                View and manage attendance records by course and class.
              </p>
            </div>

            <button
              type="button"
              className="attendance-refresh-btn"
              onClick={loadSessions}
              disabled={loading}
            >
              <FaSyncAlt
                className={loading ? "spinning" : ""}
              />

              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>

          {/* =========================
              FILTERS
             ========================= */}

          {!loading && !error && sessions.length > 0 && (
            <div className="attendance-history-filters">

              <div className="attendance-filter-search">
                <FaSearch />

                <input
                  type="text"
                  placeholder="Search course, code or class..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="attendance-filter-control">
                <FaFilter />

                <select
                  value={selectedClass}
                  onChange={(e) =>
                    setSelectedClass(e.target.value)
                  }
                >
                  {classOptions.map((className) => (
                    <option
                      key={className}
                      value={className}
                    >
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-filter-control">
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value)
                  }
                >
                  <option value="All Status">
                    All Status
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Closed">
                    Closed
                  </option>

                  <option value="Expired">
                    Expired
                  </option>
                </select>
              </div>

              <div className="attendance-filter-date">
                <FaCalendarAlt />

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(e.target.value)
                  }
                />
              </div>

              {(search ||
                selectedClass !== "All Classes" ||
                selectedStatus !== "All Status" ||
                selectedDate) && (
                <button
                  type="button"
                  className="attendance-clear-filter-btn"
                  onClick={clearFilters}
                >
                  <FaTimes />
                  Clear
                </button>
              )}

            </div>
          )}

          {/* =========================
              FILTER RESULT INFO
             ========================= */}

          {!loading &&
            !error &&
            sessions.length > 0 && (
              <div className="attendance-filter-result">

                <div>
                  Showing{" "}
                  <strong>{filteredSessions.length}</strong>{" "}
                  of{" "}
                  <strong>{sessions.length}</strong>{" "}
                  attendance sessions
                </div>

                <div>
                  <FaUsers />
                  <strong>
                    {filteredStudentsRecorded}
                  </strong>{" "}
                  students recorded
                </div>

              </div>
            )}

          {/* =========================
              LOADING
             ========================= */}

          {loading && (
            <div className="attendance-history-empty">

              <div className="attendance-loading-icon">
                <FaClipboardCheck />
              </div>

              <h3>
                Loading attendance history...
              </h3>

              <p>
                Please wait while we retrieve your attendance sessions.
              </p>

            </div>
          )}

          {/* =========================
              ERROR
             ========================= */}

          {!loading && error && (
            <div className="attendance-history-empty error-state">

              <div className="attendance-loading-icon">
                <FaClipboardCheck />
              </div>

              <h3>
                Unable to load attendance history
              </h3>

              <p>{error}</p>

              <button
                type="button"
                className="attendance-retry-btn"
                onClick={loadSessions}
              >
                <FaSyncAlt />
                Try Again
              </button>

            </div>
          )}

          {/* =========================
              EMPTY
             ========================= */}

          {!loading &&
            !error &&
            sessions.length === 0 && (
              <div className="attendance-history-empty">

                <div className="attendance-loading-icon">
                  <FaClipboardCheck />
                </div>

                <h3>
                  No attendance sessions yet
                </h3>

                <p>
                  Attendance sessions that you generate
                  will appear here.
                </p>

                <Link
                  to="/lecturer/start-attendance"
                  className="attendance-start-btn"
                >
                  <FaClipboardCheck />
                  Start Attendance
                  <FaArrowRight />
                </Link>

              </div>
            )}

          {/* =========================
              NO FILTER RESULTS
             ========================= */}

          {!loading &&
            !error &&
            sessions.length > 0 &&
            filteredSessions.length === 0 && (
              <div className="attendance-history-empty">

                <div className="attendance-loading-icon">
                  <FaSearch />
                </div>

                <h3>
                  No matching attendance sessions
                </h3>

                <p>
                  Try changing your search or filter options.
                </p>

                <button
                  type="button"
                  className="attendance-retry-btn"
                  onClick={clearFilters}
                >
                  <FaTimes />
                  Clear Filters
                </button>

              </div>
            )}

          {/* =========================
              DESKTOP TABLE
             ========================= */}

          {!loading &&
            !error &&
            filteredSessions.length > 0 && (
              <div className="attendance-table-wrapper">

                <table className="attendance-history-table">

                  <thead>
                    <tr>
                      <th>COURSE</th>
                      <th>CODE</th>
                      <th>CLASS</th>
                      <th>STATUS</th>
                      <th>STUDENTS</th>
                      <th>DATE & TIME</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredSessions.map((session) => (

                      <tr key={session._id}>

                        {/* COURSE */}

                        <td>
                          <div className="attendance-course-cell">

                            <div className="attendance-course-icon">
                              <FaBook />
                            </div>

                            <div>
                              <strong>
                                {session.course?.courseName ||
                                  "Unknown Course"}
                              </strong>

                              {session.course?.title &&
                                session.course.title !==
                                  session.course.courseName && (
                                  <small>
                                    {session.course.title}
                                  </small>
                                )}
                            </div>

                          </div>
                        </td>

                        {/* CODE */}

                        <td>
                          <span className="course-code">
                            {session.course?.courseCode ||
                              "N/A"}
                          </span>
                        </td>

                        {/* CLASS */}

                        <td>
                          {session.className ? (
                            <span className="attendance-class-badge">
                              {session.className}
                            </span>
                          ) : (
                            <span className="attendance-class-unassigned">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`attendance-status ${getStatusClass(
                              session.status
                            )}`}
                          >
                            <span className="status-dot"></span>
                            {session.status || "Unknown"}
                          </span>
                        </td>

                        {/* STUDENTS */}

                        <td>
                          <div className="student-count">

                            <FaUsers />

                            <strong>
                              {session.totalStudents || 0}
                            </strong>

                            <span>
                              recorded
                            </span>

                          </div>
                        </td>

                        {/* DATE */}

                        <td>
                          <div className="attendance-date">

                            <FaCalendarAlt />

                            <div>
                              <strong>
                                {formatDate(
                                  session.startTime
                                )}
                              </strong>

                              <small>
                                {formatTime(
                                  session.startTime
                                )}
                              </small>
                            </div>

                          </div>
                        </td>

                        {/* ACTION */}

                        <td>
                          <Link
                            to={`/lecturer/attendance/${session._id}`}
                            className="attendance-view-btn"
                          >
                            View
                            <FaArrowRight />
                          </Link>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

        </div>

      </div>
    </DashboardLayout>
  );
}

export default AttendanceHistory;