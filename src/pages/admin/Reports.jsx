import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import API_URL from "../../config/api";

import "../../styles/Dashboard.css";
import "../../styles/Reports.css";

function Reports() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [period, setPeriod] = useState("thisWeek");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [error, setError] = useState("");

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
  // FETCH ATTENDANCE
  // ==========================================================
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      let url = `${API_URL}/api/attendance/report`;

      const params = new URLSearchParams();

      if (period && period !== "all") {
        params.append("period", period);
      }

      if (period === "custom") {
        if (!fromDate || !toDate) {
          setAttendance([]);
          setLoading(false);
          return;
        }

        params.append("from", fromDate);
        params.append("to", toDate);
      }

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
          data.message || "Failed to fetch attendance records."
        );
      }

      // Backend returns { attendance: [...] }
      // but this also safely handles a direct array response.
      setAttendance(
        Array.isArray(data) ? data : data.attendance || []
      );
    } catch (err) {
      console.error("Fetch attendance error:", err);

      setError(
        err.message || "Failed to load attendance records."
      );

      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FETCH WHEN PERIOD CHANGES
  // ==========================================================
  useEffect(() => {
    if (period === "custom") {
      if (fromDate && toDate) {
        fetchAttendance();
      }
    } else {
      fetchAttendance();
    }
  }, [period, fromDate, toDate]);

  // ==========================================================
  // UNIQUE COURSES
  // ==========================================================
  const uniqueCourses = useMemo(() => {
    const courses = attendance
      .map((record) => record.course)
      .filter(Boolean);

    const map = new Map();

    courses.forEach((course) => {
      const id = course._id || course.courseCode;

      if (!map.has(id)) {
        map.set(id, course);
      }
    });

    return Array.from(map.values());
  }, [attendance]);

  // ==========================================================
  // FILTER ATTENDANCE
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

      const lecturerName =
        record.lecturer?.name?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        studentName.includes(searchValue) ||
        indexNumber.includes(searchValue) ||
        courseName.includes(searchValue) ||
        courseCode.includes(searchValue) ||
        lecturerName.includes(searchValue);

      const matchesCourse =
        !courseFilter ||
        record.course?.courseCode === courseFilter;

      const matchesStatus =
        !statusFilter ||
        record.status === statusFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus
      );
    });
  }, [
    attendance,
    search,
    courseFilter,
    statusFilter,
  ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================
  const totalRecords = filteredAttendance.length;

  const presentRecords = filteredAttendance.filter(
    (record) => record.status === "Present"
  ).length;

  const absentRecords = filteredAttendance.filter(
    (record) => record.status === "Absent"
  ).length;

  const uniqueStudents = new Set(
    filteredAttendance
      .map((record) => record.student?._id)
      .filter(Boolean)
  ).size;

  const uniqueCoursesCount = new Set(
    filteredAttendance
      .map((record) => record.course?._id)
      .filter(Boolean)
  ).size;

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================
  const clearFilters = () => {
    setSearch("");
    setCourseFilter("");
    setStatusFilter("");
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
      alert("There are no attendance records to download.");
      return;
    }

    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 15);

    doc.setFontSize(10);
    doc.text(`Period: ${periodLabel}`, 14, 22);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      28
    );

    const tableData = filteredAttendance.map((record) => [
      record.student?.name || "—",
      record.student?.indexNumber || "—",
      record.course?.courseCode || "—",
      record.course?.courseName || "—",
      record.lecturer?.name || "—",
      formatDate(record.scannedAt),
      formatTime(record.scannedAt),
      record.status || "—",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "Student",
          "Index Number",
          "Course Code",
          "Course",
          "Lecturer",
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
      `attendance-report-${period
        .replace(/\s+/g, "-")
        .toLowerCase()}.pdf`
    );
  };

  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================
  const exportExcel = () => {
    if (!filteredAttendance.length) {
      alert("There are no attendance records to download.");
      return;
    }

    const rows = filteredAttendance.map((record) => ({
      Student:
        record.student?.name || "—",

      "Index Number":
        record.student?.indexNumber || "—",

      "Department":
        record.student?.department || "—",

      Level:
        record.student?.level || "—",

      Class:
        record.student?.className || "—",

      "Course Code":
        record.course?.courseCode || "—",

      Course:
        record.course?.courseName || "—",

      Lecturer:
        record.lecturer?.name || "—",

      Date:
        formatDate(record.scannedAt),

      Time:
        formatTime(record.scannedAt),

      Status:
        record.status || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance"
    );

    XLSX.writeFile(
      workbook,
      `attendance-report-${period
        .replace(/\s+/g, "-")
        .toLowerCase()}.xlsx`
    );
  };

  return (
    <div className="reports-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="page-header">
        <div>
          <h1>Attendance Reports</h1>
          <p>
            View, filter and download attendance records by period.
          </p>
        </div>
      </div>


      {/* =====================================================
          PERIOD FILTER
      ===================================================== */}
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
            onClick={() => setPeriod("thisWeek")}
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
            onClick={() => setPeriod("lastWeek")}
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
            onClick={() => setPeriod("bothWeeks")}
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
            onClick={() => setPeriod("all")}
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
            onClick={() => setPeriod("custom")}
          >
            Custom Period
          </button>

        </div>

        {/* Custom dates */}
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


      {/* =====================================================
          SEARCH / FILTERS
      ===================================================== */}
      <div className="report-filter-card">

        <div className="report-search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Search student, index number, course or lecturer..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="report-filter-select">

          <select
            value={courseFilter}
            onChange={(e) =>
              setCourseFilter(e.target.value)
            }
          >
            <option value="">
              All Courses
            </option>

            {uniqueCourses.map((course) => (
              <option
                key={course._id || course.courseCode}
                value={course.courseCode}
              >
                {course.courseCode} - {course.courseName}
              </option>
            ))}
          </select>

        </div>

        <div className="report-filter-select">

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="">
              All Status
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


      {/* =====================================================
          DOWNLOAD BUTTONS
      ===================================================== */}
      <div className="report-download-card">

        <div>
          <h3>Download Report</h3>

          <p>
            Current period: <strong>{periodLabel}</strong>
          </p>
        </div>

        <div className="report-download-buttons">

          <button
            type="button"
            className="download-pdf-button"
            onClick={exportPDF}
            disabled={!filteredAttendance.length}
          >
            <FaFilePdf />
            Download PDF
          </button>

          <button
            type="button"
            className="download-excel-button"
            onClick={exportExcel}
            disabled={!filteredAttendance.length}
          >
            <FaFileExcel />
            Download Excel
          </button>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <div className="report-error">
          {error}
        </div>
      )}


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}
      <div className="report-summary-grid">

        <div className="report-summary-card">
          <span>Total Records</span>
          <strong>{totalRecords}</strong>
        </div>

        <div className="report-summary-card">
          <span>Present</span>
          <strong>{presentRecords}</strong>
        </div>

        <div className="report-summary-card">
          <span>Absent</span>
          <strong>{absentRecords}</strong>
        </div>

        <div className="report-summary-card">
          <span>Students</span>
          <strong>{uniqueStudents}</strong>
        </div>

        <div className="report-summary-card">
          <span>Courses</span>
          <strong>{uniqueCoursesCount}</strong>
        </div>

      </div>


      {/* =====================================================
          TABLE
      ===================================================== */}
      <div className="report-table-card">

        <div className="report-table-header">

          <div>
            <h3>Attendance Records</h3>

            <p>
              Showing {filteredAttendance.length} record
              {filteredAttendance.length !== 1 ? "s" : ""}
            </p>
          </div>

          <FaDownload />

        </div>


        {loading ? (
          <div className="report-loading">
            Loading attendance records...
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="report-empty">
            <FaCalendarAlt />

            <h3>No Attendance Records</h3>

            <p>
              There are no attendance records for the selected
              period and filters.
            </p>
          </div>
        ) : (
          <div className="report-table-wrapper">

            <table className="report-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Index Number</th>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredAttendance.map((record) => (
                  <tr key={record._id}>

                    <td>
                      {record.student?.name || "—"}
                    </td>

                    <td>
                      {record.student?.indexNumber || "—"}
                    </td>

                    <td>
                      <div className="course-cell">
                        <strong>
                          {record.course?.courseCode || "—"}
                        </strong>

                        <span>
                          {record.course?.courseName || "—"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {record.lecturer?.name || "—"}
                    </td>

                    <td>
                      {record.student?.className ||
                        record.session?.className ||
                        "—"}
                    </td>

                    <td>
                      {formatDate(record.scannedAt)}
                    </td>

                    <td>
                      {formatTime(record.scannedAt)}
                    </td>

                    <td>

                      <span
                        className={
                          record.status === "Present"
                            ? "status-badge present"
                            : "status-badge absent"
                        }
                      >
                        {record.status || "—"}
                      </span>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Reports;