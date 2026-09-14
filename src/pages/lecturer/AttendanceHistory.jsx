import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  // ==========================================================
  // STATE
  // ==========================================================

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

  // Used to prevent an older request from overwriting
  // the result of a newer period request.
  const requestIdRef = useRef(0);

  // Abort previous requests when the period changes.
  const abortControllerRef = useRef(null);

  // ==========================================================
  // USER
  // ==========================================================

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  }, []);

  // ==========================================================
  // CLASS OPTIONS
  // ==========================================================

  const classOptions = [
    "Class A",
    "Class B",
    "Class C",
    "Class D",
    "Class E",
  ];

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
  // BUILD PERIOD QUERY
  // ==========================================================

  const buildPeriodQuery = () => {
    const params = new URLSearchParams();

    params.set("period", period);

    if (period === "custom") {
      if (fromDate) {
        params.set("from", fromDate);
      }

      if (toDate) {
        params.set("to", toDate);
      }
    }

    return params.toString();
  };

  // ==========================================================
  // FETCH SESSIONS + ATTENDANCE FOR CURRENT PERIOD
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadPeriodData = async () => {
      // --------------------------------------------------------
      // CUSTOM PERIOD
      // Do not request anything until both dates are selected.
      // --------------------------------------------------------

      if (
        period === "custom" &&
        (!fromDate || !toDate)
      ) {
        setSessions([]);
        setAttendance([]);
        setLoading(false);
        setReportLoading(false);
        setError("");
        return;
      }

      // --------------------------------------------------------
      // Validate custom date order before sending request.
      // --------------------------------------------------------

      if (
        period === "custom" &&
        fromDate &&
        toDate &&
        fromDate > toDate
      ) {
        setSessions([]);
        setAttendance([]);
        setLoading(false);
        setReportLoading(false);
        setError(
          "The From date cannot be after the To date."
        );
        return;
      }

      // --------------------------------------------------------
      // Cancel previous request.
      // --------------------------------------------------------

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();

      abortControllerRef.current = controller;

      const currentRequestId =
        ++requestIdRef.current;

      try {
        setLoading(true);
        setReportLoading(true);
        setError("");

        // ------------------------------------------------------
        // Clear old data immediately.
        //
        // This is important.
        // We don't keep showing Last Week while This Week is
        // loading.
        // ------------------------------------------------------

        setSessions([]);
        setAttendance([]);

        const token =
          localStorage.getItem("token");

        if (!user?.id) {
          throw new Error(
            "Lecturer account information was not found."
          );
        }

        const query =
          buildPeriodQuery();

        // ------------------------------------------------------
        // ENDPOINTS
        // ------------------------------------------------------

        const sessionsUrl =
          `${API_URL}/api/attendance/lecturer/${user.id}?${query}`;

        const reportUrl =
          `${API_URL}/api/attendance/lecturer/${user.id}/report?${query}`;

        // ------------------------------------------------------
        // Fetch BOTH endpoints using the SAME period.
        // ------------------------------------------------------

        const [sessionsResponse, reportResponse] =
          await Promise.all([
            fetch(sessionsUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }),

            fetch(reportUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }),
          ]);

        const sessionsData =
          await sessionsResponse.json();

        const reportData =
          await reportResponse.json();

        // ------------------------------------------------------
        // If another request has started, ignore this response.
        // ------------------------------------------------------

        if (
          cancelled ||
          controller.signal.aborted ||
          currentRequestId !==
            requestIdRef.current
        ) {
          return;
        }

        // ------------------------------------------------------
        // Check sessions response
        // ------------------------------------------------------

        if (!sessionsResponse.ok) {
          throw new Error(
            sessionsData.message ||
              "Failed to fetch attendance sessions."
          );
        }

        // ------------------------------------------------------
        // Check report response
        // ------------------------------------------------------

        if (!reportResponse.ok) {
          throw new Error(
            reportData.message ||
              "Failed to fetch attendance report."
          );
        }

        // ------------------------------------------------------
        // Extract sessions.
        //
        // Backend returns:
        // {
        //   sessions: [...]
        // }
        // ------------------------------------------------------

        const fetchedSessions =
          Array.isArray(sessionsData)
            ? sessionsData
            : Array.isArray(
                sessionsData.sessions
              )
            ? sessionsData.sessions
            : [];

        // ------------------------------------------------------
        // Extract attendance.
        //
        // Backend returns:
        // {
        //   attendance: [...]
        // }
        // ------------------------------------------------------

        const fetchedAttendance =
          Array.isArray(reportData)
            ? reportData
            : Array.isArray(
                reportData.attendance
              )
            ? reportData.attendance
            : [];

        // ------------------------------------------------------
        // FINAL SAFETY FILTER
        //
        // The backend already filters by period.
        // We additionally verify the returned records on the
        // frontend so stale/mismatched records cannot appear.
        // ------------------------------------------------------

        const periodRange =
          getFrontendPeriodRange(
            period,
            fromDate,
            toDate
          );

        const finalSessions =
          fetchedSessions.filter(
            (session) =>
              isDateInsideRange(
                session.startTime ||
                  session.date ||
                  session.createdAt,
                periodRange
              )
          );

        const finalAttendance =
          fetchedAttendance.filter(
            (record) =>
              isDateInsideRange(
                record.scannedAt ||
                  record.createdAt,
                periodRange
              )
          );

        // ------------------------------------------------------
        // Only update state if this is still the newest request.
        // ------------------------------------------------------

        if (
          !cancelled &&
          !controller.signal.aborted &&
          currentRequestId ===
            requestIdRef.current
        ) {
          setSessions(finalSessions);
          setAttendance(finalAttendance);
        }
      } catch (err) {
        // Ignore AbortController cancellations.
        if (
          err?.name === "AbortError"
        ) {
          return;
        }

        if (
          cancelled ||
          currentRequestId !==
            requestIdRef.current
        ) {
          return;
        }

        console.error(
          "Attendance period fetch error:",
          err
        );

        setSessions([]);
        setAttendance([]);

        setError(
          err.message ||
            "Failed to load attendance data."
        );
      } finally {
        if (
          !cancelled &&
          currentRequestId ===
            requestIdRef.current
        ) {
          setLoading(false);
          setReportLoading(false);
        }
      }
    };

    loadPeriodData();

    return () => {
      cancelled = true;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    period,
    fromDate,
    toDate,
    user?.id,
  ]);

  // ==========================================================
  // FRONTEND PERIOD RANGE
  // ==========================================================

  function getFrontendPeriodRange(
    selectedPeriod,
    customFrom,
    customTo
  ) {
    const now = new Date();

    // Start of Monday this week.
    const currentDay =
      now.getDay();

    const daysFromMonday =
      currentDay === 0
        ? 6
        : currentDay - 1;

    const thisWeekStart =
      new Date(now);

    thisWeekStart.setHours(
      0,
      0,
      0,
      0
    );

    thisWeekStart.setDate(
      thisWeekStart.getDate() -
        daysFromMonday
    );

    // End of Sunday this week.
    const thisWeekEnd =
      new Date(thisWeekStart);

    thisWeekEnd.setDate(
      thisWeekEnd.getDate() + 6
    );

    thisWeekEnd.setHours(
      23,
      59,
      59,
      999
    );

    // Last week.
    const lastWeekStart =
      new Date(thisWeekStart);

    lastWeekStart.setDate(
      lastWeekStart.getDate() - 7
    );

    const lastWeekEnd =
      new Date(thisWeekStart);

    lastWeekEnd.setMilliseconds(-1);

    // ----------------------------------------------------------
    // This Week
    // ----------------------------------------------------------

    if (
      selectedPeriod ===
      "thisWeek"
    ) {
      return {
        start: thisWeekStart,
        end: thisWeekEnd,
      };
    }

    // ----------------------------------------------------------
    // Last Week
    // ----------------------------------------------------------

    if (
      selectedPeriod ===
      "lastWeek"
    ) {
      return {
        start: lastWeekStart,
        end: lastWeekEnd,
      };
    }

    // ----------------------------------------------------------
    // Both Weeks
    // ----------------------------------------------------------

    if (
      selectedPeriod ===
      "bothWeeks"
    ) {
      return {
        start: lastWeekStart,
        end: thisWeekEnd,
      };
    }

    // ----------------------------------------------------------
    // Custom
    // ----------------------------------------------------------

    if (
      selectedPeriod ===
      "custom"
    ) {
      if (
        !customFrom ||
        !customTo
      ) {
        return null;
      }

      const start =
        new Date(
          `${customFrom}T00:00:00`
        );

      const end =
        new Date(
          `${customTo}T23:59:59.999`
        );

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {
        return null;
      }

      return {
        start,
        end,
      };
    }

    // ----------------------------------------------------------
    // All Time
    // ----------------------------------------------------------

    return null;
  }

  // ==========================================================
  // CHECK DATE AGAINST SELECTED PERIOD
  // ==========================================================

  function isDateInsideRange(
    value,
    range
  ) {
    // All Time
    if (!range) {
      return true;
    }

    if (!value) {
      return false;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    return (
      date >= range.start &&
      date <= range.end
    );
  }

  // ==========================================================
  // FILTER SESSIONS
  // ==========================================================

  const filteredSessions =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return sessions.filter(
        (session) => {
          const courseName =
            session.course?.courseName?.toLowerCase() ||
            "";

          const courseCode =
            session.course?.courseCode?.toLowerCase() ||
            "";

          const className =
            session.className?.toLowerCase() ||
            "";

          const status =
            session.status?.toLowerCase() ||
            "";

          const matchesSearch =
            !searchValue ||
            courseName.includes(
              searchValue
            ) ||
            courseCode.includes(
              searchValue
            ) ||
            className.includes(
              searchValue
            ) ||
            status.includes(
              searchValue
            );

          const matchesClass =
            !selectedClass ||
            session.className ===
              selectedClass;

          const matchesStatus =
            !selectedStatus ||
            session.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesClass &&
            matchesStatus
          );
        }
      );
    }, [
      sessions,
      search,
      selectedClass,
      selectedStatus,
    ]);

  // ==========================================================
  // FILTER ATTENDANCE
  // ==========================================================

  const filteredAttendance =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return attendance.filter(
        (record) => {
          const studentName =
            record.student?.name?.toLowerCase() ||
            "";

          const indexNumber =
            record.student?.indexNumber?.toLowerCase() ||
            "";

          const courseName =
            record.course?.courseName?.toLowerCase() ||
            "";

          const courseCode =
            record.course?.courseCode?.toLowerCase() ||
            "";

          const className =
            record.student?.className?.toLowerCase() ||
            record.session?.className?.toLowerCase() ||
            "";

          const matchesSearch =
            !searchValue ||
            studentName.includes(
              searchValue
            ) ||
            indexNumber.includes(
              searchValue
            ) ||
            courseName.includes(
              searchValue
            ) ||
            courseCode.includes(
              searchValue
            ) ||
            className.includes(
              searchValue
            );

          const matchesClass =
            !selectedClass ||
            record.student?.className ===
              selectedClass ||
            record.session?.className ===
              selectedClass;

          const matchesStatus =
            !selectedStatus ||
            record.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesClass &&
            matchesStatus
          );
        }
      );
    }, [
      attendance,
      search,
      selectedClass,
      selectedStatus,
    ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalSessions =
    filteredSessions.length;

  const totalStudentsRecorded =
    filteredSessions.reduce(
      (total, session) =>
        total +
        Number(
          session.totalStudents ??
            session.studentCount ??
            0
        ),
      0
    );

  const activeSessions =
    filteredSessions.filter(
      (session) =>
        session.status ===
        "active"
    ).length;

  const uniqueCourses =
    new Set(
      filteredSessions
        .map(
          (session) =>
            session.course?._id
        )
        .filter(Boolean)
    ).size;

  const totalReportRecords =
    filteredAttendance.length;

  const presentRecords =
    filteredAttendance.filter(
      (record) =>
        record.status ===
        "Present"
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

    setError("");
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "—";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString();
  };

  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const formatTime = (
    dateValue
  ) => {
    if (!dateValue) {
      return "—";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================================
  // EXPORT PDF
  // ==========================================================

  const exportPDF = () => {
    if (
      !filteredAttendance.length
    ) {
      alert(
        "There are no attendance records to download."
      );

      return;
    }

    const doc =
      new jsPDF("landscape");

    doc.setFontSize(18);

    doc.text(
      "Lecturer Attendance Report",
      14,
      15
    );

    doc.setFontSize(10);

    doc.text(
      `Lecturer: ${
        user?.name || "Lecturer"
      }`,
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
      filteredAttendance.map(
        (record) => [
          record.student?.name ||
            "—",

          record.student
            ?.indexNumber ||
            "—",

          record.student
            ?.className ||
            record.session
              ?.className ||
            "—",

          record.course
            ?.courseCode ||
            "—",

          record.course
            ?.courseName ||
            "—",

          formatDate(
            record.scannedAt
          ),

          formatTime(
            record.scannedAt
          ),

          record.status ||
            "—",
        ]
      );

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
    if (
      !filteredAttendance.length
    ) {
      alert(
        "There are no attendance records to download."
      );

      return;
    }

    const rows =
      filteredAttendance.map(
        (record) => ({
          Student:
            record.student
              ?.name ||
            "—",

          "Index Number":
            record.student
              ?.indexNumber ||
            "—",

          Department:
            record.student
              ?.department ||
            "—",

          Level:
            record.student
              ?.level ||
            "—",

          Class:
            record.student
              ?.className ||
            record.session
              ?.className ||
            "—",

          "Course Code":
            record.course
              ?.courseCode ||
            "—",

          Course:
            record.course
              ?.courseName ||
            "—",

          Date:
            formatDate(
              record.scannedAt
            ),

          Time:
            formatTime(
              record.scannedAt
            ),

          Status:
            record.status ||
            "—",
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

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

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="attendance-history-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="page-header">
        <div>
          <h1>
            Attendance History
          </h1>

          <p>
            View your attendance
            sessions and download
            attendance reports by
            period.
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
            <h3>
              Attendance Period
            </h3>

            <p>
              Select the period you
              want to view or
              download.
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
              setPeriod(
                "thisWeek"
              )
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
              setPeriod(
                "lastWeek"
              )
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
              setPeriod(
                "bothWeeks"
              )
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

              <label>
                From
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="filter-group">

              <label>
                To
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
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
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="report-filter-select">

          <select
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(
                e.target.value
              )
            }
          >
            <option value="">
              All Classes
            </option>

            {classOptions.map(
              (className) => (
                <option
                  key={className}
                  value={className}
                >
                  {className}
                </option>
              )
            )}

          </select>

        </div>

        <div className="report-filter-select">

          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(
                e.target.value
              )
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
          onClick={
            clearFilters
          }
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

          <h3>
            Download Attendance
            Report
          </h3>

          <p>
            Current period:{" "}
            <strong>
              {periodLabel}
            </strong>
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
          <span>
            Sessions
          </span>

          <strong>
            {totalSessions}
          </strong>
        </div>

        <div className="report-summary-card">
          <span>
            Courses
          </span>

          <strong>
            {uniqueCourses}
          </strong>
        </div>

        <div className="report-summary-card">
          <span>
            Students Recorded
          </span>

          <strong>
            {totalStudentsRecorded}
          </strong>
        </div>

        <div className="report-summary-card">
          <span>
            Report Records
          </span>

          <strong>
            {totalReportRecords}
          </strong>
        </div>

        <div className="report-summary-card">
          <span>
            Present
          </span>

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

            <h3>
              Attendance Sessions
            </h3>

            <p>
              {filteredSessions.length}{" "}
              session
              {filteredSessions.length !==
              1
                ? "s"
                : ""}
            </p>

          </div>

          {loading && (
            <div className="report-loading">
              Loading {periodLabel.toLowerCase()}...
            </div>
          )}

        </div>

        {loading ? (
          <div className="report-loading">
            Fetching attendance data...
          </div>
        ) : filteredSessions.length ===
          0 ? (
          <div className="report-empty">

            <FaCalendarAlt />

            <h3>
              No Attendance Sessions
            </h3>

            <p>
              No attendance sessions
              were found for{" "}
              <strong>
                {periodLabel}
              </strong>
              .
            </p>

          </div>
        ) : (
          <div className="attendance-history-table-wrapper">

            <table className="attendance-history-table">

              <thead>

                <tr>
                  <th>
                    Course
                  </th>

                  <th>
                    Code
                  </th>

                  <th>
                    Class
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Students
                  </th>

                  <th>
                    Date & Time
                  </th>

                  <th>
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredSessions.map(
                  (session) => (
                    <tr
                      key={
                        session._id
                      }
                    >

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
                        {session.totalStudents ??
                          session.studentCount ??
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

      {/* ====================================================
          ATTENDANCE REPORT
      ==================================================== */}

      <div className="attendance-history-card">

        <div className="attendance-history-header">

          <div>

            <h3>
              Attendance Report
            </h3>

            <p>
              Attendance records for{" "}
              <strong>
                {periodLabel}
              </strong>
            </p>

          </div>

        </div>

        {reportLoading ? (
          <div className="report-loading">
            Loading attendance report...
          </div>
        ) : filteredAttendance.length ===
          0 ? (
          <div className="report-empty">

            <FaCalendarAlt />

            <h3>
              No Attendance Records
            </h3>

            <p>
              No student attendance
              records were found for{" "}
              <strong>
                {periodLabel}
              </strong>
              .
            </p>

          </div>
        ) : (
          <div className="attendance-history-table-wrapper">

            <table className="attendance-history-table">

              <thead>

                <tr>

                  <th>
                    Student
                  </th>

                  <th>
                    Index Number
                  </th>

                  <th>
                    Class
                  </th>

                  <th>
                    Course
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Time
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredAttendance.map(
                  (record) => (
                    <tr
                      key={
                        record._id
                      }
                    >

                      <td>
                        {record.student
                          ?.name ||
                          "—"}
                      </td>

                      <td>
                        {record.student
                          ?.indexNumber ||
                          "—"}
                      </td>

                      <td>
                        {record.student
                          ?.className ||
                          record.session
                            ?.className ||
                          "—"}
                      </td>

                      <td>
                        {record.course
                          ?.courseName ||
                          record.course
                            ?.courseCode ||
                          "—"}
                      </td>

                      <td>
                        {formatDate(
                          record.scannedAt
                        )}
                      </td>

                      <td>
                        {formatTime(
                          record.scannedAt
                        )}
                      </td>

                      <td>

                        <span
                          className={
                            record.status ===
                            "Present"
                              ? "status-badge active"
                              : "status-badge closed"
                          }
                        >
                          {record.status ||
                            "—"}
                        </span>

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