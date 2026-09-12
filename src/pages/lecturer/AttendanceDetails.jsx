import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBook,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaEnvelope,
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTimesCircle,
  FaUsers,
  FaGraduationCap,
  FaSyncAlt,
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";

import "../../styles/attendanceDetails.css";

function AttendanceDetails() {
  const { sessionId } = useParams();

  const [attendance, setAttendance] = useState([]);
  const [session, setSession] = useState(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // =========================================================
  // LOAD ATTENDANCE
  // =========================================================

  useEffect(() => {
    loadAttendance();
  }, [sessionId]);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/attendance/session/${sessionId}`,
        {
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
            "Failed to load attendance details."
        );
      }

      setAttendance(data.attendance || []);
      setSession(data.session || null);
    } catch (error) {
      console.error(
        "Error loading attendance details:",
        error
      );

      setError(
        error.message ||
          "Unable to load attendance details."
      );

      setAttendance([]);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(date) {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // =========================================================
  // FORMAT TIME
  // =========================================================

  function formatTime(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =========================================================
  // SESSION INFORMATION
  // =========================================================

  const courseName =
    session?.course?.courseName ||
    "Unknown Course";

  const courseCode =
    session?.course?.courseCode ||
    "N/A";

  const department =
    session?.department ||
    session?.course?.department ||
    "N/A";

  const level =
    session?.level ||
    session?.course?.level ||
    "N/A";

  const className =
    session?.className ||
    "N/A";

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalStudents = attendance.length;

  const presentCount = attendance.filter(
    (record) =>
      String(record.status).toLowerCase() ===
      "present"
  ).length;

  const absentCount = attendance.filter(
    (record) =>
      String(record.status).toLowerCase() ===
      "absent"
  ).length;

  const attendanceRate =
    totalStudents > 0
      ? Math.round(
          (presentCount / totalStudents) * 100
        )
      : 0;

  // =========================================================
  // FILTER ATTENDANCE
  // =========================================================

  const filteredAttendance = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return attendance.filter((record) => {
      const name =
        record.student?.name?.toLowerCase() ||
        "";

      const indexNumber =
        record.student?.indexNumber?.toLowerCase() ||
        "";

      const email =
        record.student?.email?.toLowerCase() ||
        "";

      const studentClass =
        record.student?.className?.toLowerCase() ||
        "";

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        indexNumber.includes(searchText) ||
        email.includes(searchText) ||
        studentClass.includes(searchText);

      const recordStatus =
        String(record.status || "").toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        recordStatus === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    attendance,
    search,
    statusFilter,
  ]);

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  // =========================================================
  // EXPORT DATA PREPARATION
  // =========================================================

  function getExportRows() {
    return filteredAttendance.map(
      (record, index) => ({
        No: index + 1,

        Name:
          record.student?.name ||
          "N/A",

        "Index Number":
          record.student?.indexNumber ||
          "N/A",

        Email:
          record.student?.email ||
          "N/A",

        Department:
          record.student?.department ||
          department ||
          "N/A",

        Level:
          record.student?.level ||
          level ||
          "N/A",

        Class:
          record.student?.className ||
          className ||
          "N/A",

        Status:
          record.status ||
          "N/A",

        "Scanned Time":
          record.scannedAt
            ? formatTime(record.scannedAt)
            : "—",
      })
    );
  }

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  async function exportExcel() {
    if (filteredAttendance.length === 0) {
      alert(
        "There are no attendance records to export."
      );
      return;
    }

    try {
      setExporting(true);

      const XLSX = await import("xlsx");

      const rows = getExportRows();

      const worksheet =
        XLSX.utils.json_to_sheet(rows);

      // Column widths
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 20 },
        { wch: 32 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Attendance"
      );

      const safeCourseCode =
        courseCode
          .replace(/[^a-zA-Z0-9-_]/g, "_");

      const safeClassName =
        className
          .replace(/[^a-zA-Z0-9-_]/g, "_");

      const fileName =
        `${safeCourseCode}_${safeClassName}_Attendance.xlsx`;

      XLSX.writeFile(
        workbook,
        fileName
      );
    } catch (error) {
      console.error(
        "Excel export error:",
        error
      );

      alert(
        "Unable to export Excel file. Please make sure the xlsx package is installed."
      );
    } finally {
      setExporting(false);
    }
  }

  // =========================================================
  // EXPORT PDF
  // =========================================================

  async function exportPDF() {
    if (filteredAttendance.length === 0) {
      alert(
        "There are no attendance records to export."
      );
      return;
    }

    try {
      setExporting(true);

      const jsPDFModule =
        await import("jspdf");

      const autoTableModule =
        await import(
          "jspdf-autotable"
        );

      const jsPDF =
        jsPDFModule.default;

      const autoTable =
        autoTableModule.default;

      const doc = new jsPDF();

      const rows = filteredAttendance.map(
        (record, index) => [
          index + 1,

          record.student?.name ||
            "N/A",

          record.student?.indexNumber ||
            "N/A",

          record.student?.email ||
            "N/A",

          record.student?.className ||
            className ||
            "N/A",

          record.status ||
            "N/A",

          record.scannedAt
            ? formatTime(record.scannedAt)
            : "—",
        ]
      );

      // -------------------------------------------------------
      // PDF TITLE
      // -------------------------------------------------------

      doc.setFontSize(18);

      doc.text(
        "Attendance Report",
        14,
        18
      );

      doc.setFontSize(10);

      doc.text(
        `Course: ${courseName}`,
        14,
        27
      );

      doc.text(
        `Course Code: ${courseCode}`,
        14,
        33
      );

      doc.text(
        `Department: ${department}`,
        14,
        39
      );

      doc.text(
        `Level: ${level}`,
        14,
        45
      );

      doc.text(
        `Class: ${className}`,
        14,
        51
      );

      doc.text(
        `Date: ${formatDate(
          session?.startTime
        )}`,
        14,
        57
      );

      doc.text(
        `Present: ${presentCount}   Absent: ${absentCount}   Attendance Rate: ${attendanceRate}%`,
        14,
        63
      );

      // -------------------------------------------------------
      // TABLE
      // -------------------------------------------------------

      autoTable(doc, {
        startY: 70,

        head: [
          [
            "No.",
            "Student Name",
            "Index Number",
            "Email",
            "Class",
            "Status",
            "Time",
          ],
        ],

        body: rows,

        styles: {
          fontSize: 8,
          cellPadding: 3,
        },

        headStyles: {
          fontSize: 8,
        },

        margin: {
          left: 10,
          right: 10,
        },
      });

      // -------------------------------------------------------
      // FOOTER
      // -------------------------------------------------------

      const finalY =
        doc.lastAutoTable?.finalY ||
        70;

      doc.setFontSize(8);

      doc.text(
        "Generated by QR Attendance Management System",
        14,
        finalY + 12
      );

      const safeCourseCode =
        courseCode
          .replace(/[^a-zA-Z0-9-_]/g, "_");

      const safeClassName =
        className
          .replace(/[^a-zA-Z0-9-_]/g, "_");

      const fileName =
        `${safeCourseCode}_${safeClassName}_Attendance.pdf`;

      doc.save(fileName);
    } catch (error) {
      console.error(
        "PDF export error:",
        error
      );

      alert(
        "Unable to export PDF. Please make sure jspdf and jspdf-autotable are installed."
      );
    } finally {
      setExporting(false);
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <DashboardLayout
      title="Attendance Details"
      role="lecturer"
    >
      <div className="attendance-details-page">

        <PageHeader
          title="Attendance Details"
          subtitle="View the complete class attendance roster for this session."
        />

        {/* ===================================================
            BACK BUTTON
        =================================================== */}

        <div className="attendance-details-topbar">
          <Link
            to="/lecturer/attendance-history"
            className="attendance-back-btn"
          >
            <FaArrowLeft />
            Back to Attendance History
          </Link>

          <button
            type="button"
            className="attendance-refresh-details-btn"
            onClick={loadAttendance}
            disabled={loading}
          >
            <FaSyncAlt
              className={
                loading ? "spinning" : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {!loading && error && (
          <div className="attendance-details-error">
            <FaTimesCircle />

            <div>
              <strong>
                Unable to load attendance
              </strong>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadAttendance}
              >
                <FaSyncAlt />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <div className="attendance-details-loading">
            <FaSyncAlt className="spinning" />

            <h3>
              Loading attendance details...
            </h3>

            <p>
              Please wait while we retrieve
              the class attendance roster.
            </p>
          </div>
        )}

        {/* ===================================================
            CONTENT
        =================================================== */}

        {!loading &&
          !error &&
          session && (
            <>
              {/* =============================================
                  SESSION INFORMATION
              ============================================= */}

              <div className="attendance-session-card">

                <div className="attendance-session-icon">
                  <FaBook />
                </div>

                <div className="attendance-session-main">

                  <span className="attendance-session-label">
                    ATTENDANCE SESSION
                  </span>

                  <h2>
                    {courseName}
                  </h2>

                  <div className="attendance-session-meta">

                    <span>
                      <FaBook />
                      {courseCode}
                    </span>

                    <span>
                      <FaGraduationCap />
                      {department}
                    </span>

                    <span>
                      <FaGraduationCap />
                      {level}
                    </span>

                    <span>
                      <FaUsers />
                      {className}
                    </span>

                    <span>
                      <FaCalendarAlt />
                      {formatDate(
                        session.startTime
                      )}
                    </span>

                    <span>
                      <FaClock />
                      {formatTime(
                        session.startTime
                      )}
                    </span>

                  </div>

                </div>

                <div className="attendance-session-status">
                  <span
                    className={
                      session.status === "active"
                        ? "session-status-active"
                        : "session-status-closed"
                    }
                  >
                    <span className="status-dot"></span>

                    {session.status ||
                      "Unknown"}
                  </span>
                </div>

              </div>

              {/* =============================================
                  SUMMARY CARDS
              ============================================= */}

              <div className="attendance-details-summary">

                <div className="attendance-detail-stat blue">
                  <div className="attendance-detail-stat-icon">
                    <FaUsers />
                  </div>

                  <div>
                    <span>
                      Total Students
                    </span>

                    <strong>
                      {totalStudents}
                    </strong>
                  </div>
                </div>

                <div className="attendance-detail-stat green">
                  <div className="attendance-detail-stat-icon">
                    <FaCheckCircle />
                  </div>

                  <div>
                    <span>
                      Present
                    </span>

                    <strong>
                      {presentCount}
                    </strong>
                  </div>
                </div>

                <div className="attendance-detail-stat red">
                  <div className="attendance-detail-stat-icon">
                    <FaTimesCircle />
                  </div>

                  <div>
                    <span>
                      Absent
                    </span>

                    <strong>
                      {absentCount}
                    </strong>
                  </div>
                </div>

                <div className="attendance-detail-stat purple">
                  <div className="attendance-detail-stat-icon">
                    <FaCheckCircle />
                  </div>

                  <div>
                    <span>
                      Attendance Rate
                    </span>

                    <strong>
                      {attendanceRate}%
                    </strong>
                  </div>
                </div>

              </div>

              {/* =============================================
                  EXPORT BAR
              ============================================= */}

              <div className="attendance-export-bar">

                <div>
                  <span className="attendance-section-label">
                    REPORT EXPORT
                  </span>

                  <h3>
                    Download Attendance Report
                  </h3>

                  <p>
                    Export the complete class
                    attendance list, including
                    present and absent students.
                  </p>
                </div>

                <div className="attendance-export-actions">

                  <button
                    type="button"
                    className="attendance-export-excel"
                    onClick={exportExcel}
                    disabled={
                      exporting ||
                      filteredAttendance.length === 0
                    }
                  >
                    <FaFileExcel />

                    {exporting
                      ? "Preparing..."
                      : "Export Excel"}
                  </button>

                  <button
                    type="button"
                    className="attendance-export-pdf"
                    onClick={exportPDF}
                    disabled={
                      exporting ||
                      filteredAttendance.length === 0
                    }
                  >
                    <FaFilePdf />

                    {exporting
                      ? "Preparing..."
                      : "Export PDF"}
                  </button>

                </div>

              </div>

              {/* =============================================
                  STUDENT LIST
              ============================================= */}

              <div className="attendance-details-section">

                <div className="attendance-details-section-header">

                  <div>
                    <span className="attendance-section-label">
                      CLASS ROSTER
                    </span>

                    <h2>
                      Student Attendance
                    </h2>

                    <p>
                      {filteredAttendance.length}{" "}
                      of {totalStudents} students
                      displayed.
                    </p>
                  </div>

                </div>

                {/* FILTERS */}

                <div className="attendance-details-filters">

                  <div className="attendance-details-search">

                    <FaSearch />

                    <input
                      type="text"
                      placeholder="Search by name, index number or email..."
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                    className="attendance-status-filter"
                  >
                    <option value="all">
                      All Students
                    </option>

                    <option value="present">
                      Present
                    </option>

                    <option value="absent">
                      Absent
                    </option>
                  </select>

                  {(search ||
                    statusFilter !== "all") && (
                    <button
                      type="button"
                      className="attendance-clear-filters"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </button>
                  )}

                </div>

                {/* TABLE */}

                {filteredAttendance.length ===
                0 ? (
                  <div className="attendance-no-results">

                    <FaSearch />

                    <h3>
                      No students found
                    </h3>

                    <p>
                      Try changing your search
                      or filter.
                    </p>

                  </div>
                ) : (
                  <div className="attendance-details-table-wrapper">

                    <table className="attendance-details-table">

                      <thead>
                        <tr>
                          <th>#</th>
                          <th>STUDENT</th>
                          <th>INDEX NUMBER</th>
                          <th>EMAIL</th>
                          <th>CLASS</th>
                          <th>STATUS</th>
                          <th>TIME</th>
                        </tr>
                      </thead>

                      <tbody>

                        {filteredAttendance.map(
                          (record, index) => {

                            const isPresent =
                              String(
                                record.status
                              ).toLowerCase() ===
                              "present";

                            return (
                              <tr
                                key={
                                  record._id ||
                                  `student-${index}`
                                }
                                className={
                                  isPresent
                                    ? ""
                                    : "attendance-absent-row"
                                }
                              >

                                <td>
                                  <span className="attendance-row-number">
                                    {index + 1}
                                  </span>
                                </td>

                                <td>
                                  <div className="attendance-student-cell">

                                    <div className="attendance-student-avatar">
                                      {record.student?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        "S"}
                                    </div>

                                    <div>
                                      <strong>
                                        {record.student?.name ||
                                          "N/A"}
                                      </strong>

                                      <small>
                                        {record.student?.department ||
                                          department}
                                      </small>
                                    </div>

                                  </div>
                                </td>

                                <td>
                                  <span className="attendance-index-number">
                                    {record.student
                                      ?.indexNumber ||
                                      "N/A"}
                                  </span>
                                </td>

                                <td>
                                  <div className="attendance-email-cell">

                                    <FaEnvelope />

                                    <span>
                                      {record.student
                                        ?.email ||
                                        "N/A"}
                                    </span>

                                  </div>
                                </td>

                                <td>
                                  <span className="attendance-class-badge">
                                    {record.student
                                      ?.className ||
                                      className ||
                                      "N/A"}
                                  </span>
                                </td>

                                <td>

                                  {isPresent ? (
                                    <span className="attendance-record-status present">
                                      <FaCheckCircle />
                                      Present
                                    </span>
                                  ) : (
                                    <span className="attendance-record-status absent">
                                      <FaTimesCircle />
                                      Absent
                                    </span>
                                  )}

                                </td>

                                <td>
                                  <div className="attendance-record-time">

                                    {record.scannedAt ? (
                                      <>
                                        <FaClock />

                                        <span>
                                          {formatTime(
                                            record.scannedAt
                                          )}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="attendance-not-scanned">
                                        —
                                      </span>
                                    )}

                                  </div>
                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>
            </>
          )}

      </div>
    </DashboardLayout>
  );
}

export default AttendanceDetails;