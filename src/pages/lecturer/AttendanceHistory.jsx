import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import API_URL from "../../config/api";

import "../../styles/Dashboard.css";
import "../../styles/attendanceHistory.css";

function AttendanceHistory() {
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [period, setPeriod] = useState("thisWeek");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // ==========================================================
  // PERIOD LABEL
  // ==========================================================
  const periodLabel = useMemo(() => {
    if (period === "thisWeek") {
      return "This Week";
    }

    if (period === "lastWeek") {
      return "Last Week";
    }

    if (period === "bothWeeks") {
      return "This Week & Last Week";
    }

    if (period === "custom") {
      if (fromDate && toDate) {
        return `${fromDate} to ${toDate}`;
      }

      return "Custom Period";
    }

    return "All Time";
  }, [period, fromDate, toDate]);

  // ==========================================================
  // FETCH LECTURER SESSIONS
  // ==========================================================
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/attendance/lecturer/${user?.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch attendance sessions."
        );
      }

      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch lecturer sessions error:", err);

      setError(
        err.message ||
          "Failed to load attendance sessions."
      );

      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FETCH LECTURER REPORT
  // ==========================================================
  const fetchAttendanceReport = async () => {
    try {
      if (
        period === "custom" &&
        (!fromDate || !toDate)
      ) {
        setAttendance([]);
        return;
      }

      setReportLoading(true);

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();

      if (period && period !== "all") {
        params.append("period", period);
      }

      if (period === "custom") {
        params.append("from", fromDate);
        params.append("to", toDate);
      }

      let url =
        `${API_URL}/api/attendance/lecturer/${user?.id}/report`;

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch attendance report."
        );
      }

      setAttendance(
        Array.isArray(data)
          ? data
          : data.attendance || []
      );
    } catch (err) {
      console.error(
        "Fetch lecturer attendance report error:",
        err
      );

      setError(
        err.message ||
          "Failed to load attendance report."
      );

      setAttendance([]);
    } finally {
      setReportLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================
  useEffect(() => {
    fetchSessions();
  }, []);

  // ==========================================================
  // FETCH REPORT WHEN PERIOD CHANGES
  // ==========================================================
  useEffect(() => {
    if (period === "custom") {
      if (fromDate && toDate) {
        fetchAttendanceReport();
      }
    } else {
      fetchAttendanceReport();
    }
  }, [period, fromDate, toDate]);

  // ==========================================================
  // CLASS OPTIONS
  // ==========================================================
  const classOptions = ["Class A", "Class B", "Class C", "Class D", "Class E"];

  // ==========================================================
  // FILTER SESSIONS
  // ==========================================================
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
        className.includes(searchValue) ||
        status.includes(searchValue);

      const matchesClass =
        !selectedClass ||
        session.className === selectedClass;

      const matchesStatus =
        !selectedStatus ||
        session.status === selectedStatus;

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [
    sessions,
    search,
    selectedClass,
    selectedStatus,
  ]);

  // ==========================================================
  // FILTER REPORT ATTENDANCE
  // ==========================================================
  const filteredAttendance = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return attendance.filter((record) => {
      const studentName =
        record.student?.name?.toLowerCase() || "";

      const indexNumber =
        record.student?.indexNumber?.toLowerCase() || "";

      const courseName =
        record.course?.courseName?.toLowerCase() || "";

      const courseCode =
        record.course?.courseCode?.toLowerCase() || "";

      const className =
        record.student?.className?.toLowerCase() ||
        record.session?.className?.toLowerCase() ||
        "";

      const matchesSearch =
        !searchValue ||
        studentName.includes(searchValue) ||
        indexNumber.includes(searchValue) ||
        courseName.includes(searchValue) ||
        courseCode.includes(searchValue) ||
        className.includes(searchValue);

      const matchesClass =
        !selectedClass ||
        record.student?.className === selectedClass ||
        record.session?.className === selectedClass;

      const matchesStatus =
        !selectedStatus ||
        record.status === selectedStatus;

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [
    attendance,
    search,
    selectedClass,
    selectedStatus,
  ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================
  const totalSessions = filteredSessions.length;

  const totalStudentsRecorded = filteredSessions.reduce(
    (total, session) =>
      total + Number(session.studentCount || 0),
    0
  );

  const activeSessions = filteredSessions.filter(
    (session) => session.status === "active"
  ).length;

  const uniqueCourses = new Set(
    filteredSessions
      .map((session) => session.course?._id)
      .filter(Boolean)
  ).size;

  const totalReportRecords =
    filteredAttendance.length;

  const presentRecords =
    filteredAttendance.filter(
      (record) => record.status === "Present"
    ).length;

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================
  const clearFilters = () => {
    setSearch("");
    setSelectedClass("");
    setSelectedStatus("");

    setPeriod("thisWeek");
    setFromDate("");
    setToDate("");
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString();
  };

  // ==========================================================
  // FORMAT TIME
  // ==========================================================
  const formatTime = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================================
  // EXPORT PDF
  // ==========================================================
  const exportPDF = () => {
    if (!filteredAttendance.length) {
      alert(
        "There are no attendance records to download."
      );
      return;
    }

    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text(
      "Lecturer Attendance Report",
      14,
      15
    );

    doc.setFontSize(10);

    doc.text(
      `Lecturer: ${user?.name || "Lecturer"}`,
      14,
      22
    );

    doc.text(
      `Period: ${periodLabel}`,
      14,
      28
    );

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      34
    );

    const tableData =
      filteredAttendance.map((record) => [
        record.student?.name || "—",
        record.student?.indexNumber || "—",
        record.student?.className ||
          record.session?.className ||
          "—",
        record.course?.courseCode || "—",
        record.course?.courseName || "—",
        formatDate(record.scannedAt),
        formatTime(record.scannedAt),
        record.status || "—",
      ]);

    autoTable(doc, {
      startY: 41,

      head: [
        [
          "Student",
          "Index Number",
          "Class",
          "Course Code",
          "Course",
          "Date",
          "Time",
          "Status",
        ],
      ],

      body: tableData,

      styles: {
        fontSize: 8,
      },

      headStyles: {
        fontSize: 8,
      },
    });

    doc.save(
      `lecturer-attendance-${period
        .replace(/\s+/g, "-")
        .toLowerCase()}.pdf`
    );
  };

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================
  const exportExcel = () => {
    if (!filteredAttendance.length) {
      alert(
        "There are no attendance records to download."
      );
      return;
    }

    const rows =
      filteredAttendance.map((record) => ({
        Student:
          record.student?.name || "—",

        "Index Number":
          record.student?.indexNumber || "—",

        Department:
          record.student?.department || "—",

        Level:
          record.student?.level || "—",

        Class:
          record.student?.className ||
          record.session?.className ||
          "—",

        "Course Code":
          record.course?.courseCode || "—",

        Course:
          record.course?.courseName || "—",

        Date:
          formatDate(record.scannedAt),

        Time:
          formatTime(record.scannedAt),

        Status:
          record.status || "—",
      }));

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance"
    );

    XLSX.writeFile(
      workbook,
      `lecturer-attendance-${period
        .replace(/\s+/g, "-")
        .toLowerCase()}.xlsx`
    );
  };

  return (
    <div className="attendance-history-page">

      {/* ====================================================
          HEADER
      ==================================================== */}
      <div className="page-header">
        <div>
          <h1>Attendance History</h1>

          <p>
            View your attendance sessions and download
            attendance reports by period.
          </p>
        </div>
      </div>


      {/* ====================================================
          PERIOD SELECTOR
      ==================================================== */}
      <div className="report-period-card">

        <div className="report-period-title">
          <FaCalendarAlt />

          <div>
            <h3>Attendance Period</h3>

            <p>
              Select the period you want to view or download.
            </p>
          </div>
        </div>


        <div className="period-options">

          <button
            type="button"
            className={
              period === "thisWeek"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setPeriod("thisWeek")
            }
          >
            This Week
          </button>


          <button
            type="button"
            className={
              period === "lastWeek"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setPeriod("lastWeek")
            }
          >
            Last Week
          </button>


          <button
            type="button"
            className={
              period === "bothWeeks"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setPeriod("bothWeeks")
            }
          >
            Both Weeks
          </button>


          <button
            type="button"
            className={
              period === "all"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setPeriod("all")
            }
          >
            All Time
          </button>


          <button
            type="button"
            className={
              period === "custom"
                ? "period-button active"
                : "period-button"
            }
            onClick={() =>
              setPeriod("custom")
            }
          >
            Custom Period
          </button>

        </div>


        {/* ==================================================
            CUSTOM PERIOD
        ================================================== */}
        {period === "custom" && (
          <div className="custom-period-fields">

            <div className="filter-group">
              <label>From</label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
              />
            </div>


            <div className="filter-group">
              <label>To</label>

              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
              />
            </div>

          </div>
        )}

      </div>


      {/* ====================================================
          FILTERS
      ==================================================== */}
      <div className="report-filter-card">

        <div className="report-search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Search student, index number, course or class..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>


        <div className="report-filter-select">

          <select
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
          >
            <option value="">
              All Classes
            </option>

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


        <div className="report-filter-select">

          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value)
            }
          >
            <option value="">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="closed">
              Closed
            </option>

            <option value="Present">
              Present
            </option>

            <option value="Absent">
              Absent
            </option>
          </select>

        </div>


        <button
          type="button"
          className="clear-filter-button"
          onClick={clearFilters}
        >
          <FaTimes />
          Clear
        </button>

      </div>


      {/* ====================================================
          DOWNLOAD
      ==================================================== */}
      <div className="report-download-card">

        <div>
          <h3>Download Attendance Report</h3>

          <p>
            Current period:{" "}
            <strong>{periodLabel}</strong>
          </p>
        </div>


        <div className="report-download-buttons">

          <button
            type="button"
            className="download-pdf-button"
            onClick={exportPDF}
            disabled={
              reportLoading ||
              !filteredAttendance.length
            }
          >
            <FaFilePdf />
            Download PDF
          </button>


          <button
            type="button"
            className="download-excel-button"
            onClick={exportExcel}
            disabled={
              reportLoading ||
              !filteredAttendance.length
            }
          >
            <FaFileExcel />
            Download Excel
          </button>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}
      {error && (
        <div className="report-error">
          {error}
        </div>
      )}


      {/* ====================================================
          SUMMARY
      ==================================================== */}
      <div className="report-summary-grid">

        <div className="report-summary-card">
          <span>Sessions</span>
          <strong>{totalSessions}</strong>
        </div>


        <div className="report-summary-card">
          <span>Courses</span>
          <strong>{uniqueCourses}</strong>
        </div>


        <div className="report-summary-card">
          <span>Students Recorded</span>
          <strong>
            {totalStudentsRecorded}
          </strong>
        </div>


        <div className="report-summary-card">
          <span>Report Records</span>
          <strong>
            {totalReportRecords}
          </strong>
        </div>


        <div className="report-summary-card">
          <span>Present</span>
          <strong>
            {presentRecords}
          </strong>
        </div>

      </div>


      {/* ====================================================
          SESSION HISTORY
      ==================================================== */}
      <div className="attendance-history-card">

        <div className="attendance-history-header">

          <div>
            <h3>Attendance Sessions</h3>

            <p>
              {filteredSessions.length} session
              {filteredSessions.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

        </div>


        {loading ? (
          <div className="report-loading">
            Loading attendance sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="report-empty">

            <FaCalendarAlt />

            <h3>No Attendance Sessions</h3>

            <p>
              No sessions match the selected filters.
            </p>

          </div>
        ) : (
          <div className="attendance-history-table-wrapper">

            <table className="attendance-history-table">

              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>


              <tbody>

                {filteredSessions.map(
                  (session) => (
                    <tr key={session._id}>

                      <td>
                        {session.course
                          ?.courseName ||
                          "—"}
                      </td>

                      <td>
                        {session.course
                          ?.courseCode ||
                          "—"}
                      </td>

                      <td>
                        {session.className ||
                          "—"}
                      </td>

                      <td>

                        <span
                          className={
                            session.status ===
                            "active"
                              ? "status-badge active"
                              : "status-badge closed"
                          }
                        >
                          {session.status ||
                            "—"}
                        </span>

                      </td>

                      <td>
                        {session.studentCount ??
                          0}
                      </td>

                      <td>
                        {formatDate(
                          session.startTime
                        )}

                        <br />

                        <small>
                          {formatTime(
                            session.startTime
                          )}
                        </small>
                      </td>

                      <td>

                        <Link
                          to={`/lecturer/attendance/${session._id}`}
                          className="view-attendance-button"
                        >
                          View
                        </Link>

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
  );
}

export default AttendanceHistory;