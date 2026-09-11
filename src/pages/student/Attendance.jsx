import { useEffect, useMemo, useState } from "react";

import {
    FaBook,
    FaCalendarAlt,
    FaChartPie,
    FaCheckCircle,
    FaSearch,
    FaTimesCircle,
    FaUserTie
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";

import "../../styles/studentAttendance.css";

import API_URL from "../../config/api";

function Attendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filter states
    const [courseSearch, setCourseSearch] = useState("");
    const [lecturerSearch, setLecturerSearch] = useState("");
    const [dateSearch, setDateSearch] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        loadAttendance();
    }, []);

    async function loadAttendance() {
        try {
            if (!user?.id) {
                setAttendance([]);
                return;
            }

            const response = await fetch(
                `${API_URL}/api/attendance/student/${user.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load attendance");
            }

            const data = await response.json();

            setAttendance(data.attendance || []);
        } catch (error) {
            console.error("Error loading attendance:", error);
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    }

    /*
     * FILTER ATTENDANCE
     *
     * Student can search by:
     * - Course name
     * - Course code
     * - Lecturer name
     * - Date
     */
    const filteredAttendance = useMemo(() => {
        return attendance.filter((record) => {
            const courseName =
                record.course?.courseName ||
                record.course?.name ||
                "";

            const courseCode =
                record.course?.courseCode ||
                record.course?.code ||
                "";

            const lecturerName =
                record.lecturer?.name ||
                "";

            // Course search
            const matchesCourse =
                courseSearch.trim() === "" ||
                courseName
                    .toLowerCase()
                    .includes(courseSearch.toLowerCase()) ||
                courseCode
                    .toLowerCase()
                    .includes(courseSearch.toLowerCase());

            // Lecturer search
            const matchesLecturer =
                lecturerSearch.trim() === "" ||
                lecturerName
                    .toLowerCase()
                    .includes(lecturerSearch.toLowerCase());

            // Date search
            let matchesDate = true;

            if (dateSearch) {
                const recordDate =
                    record.createdAt ||
                    record.scannedAt ||
                    record.date;

                if (recordDate) {
                    const date = new Date(recordDate);

                    const year = date.getFullYear();

                    const month = String(
                        date.getMonth() + 1
                    ).padStart(2, "0");

                    const day = String(
                        date.getDate()
                    ).padStart(2, "0");

                    const formattedDate =
                        `${year}-${month}-${day}`;

                    matchesDate =
                        formattedDate === dateSearch;
                } else {
                    matchesDate = false;
                }
            }

            return (
                matchesCourse &&
                matchesLecturer &&
                matchesDate
            );
        });
    }, [
        attendance,
        courseSearch,
        lecturerSearch,
        dateSearch
    ]);

    /*
     * ATTENDANCE COUNTS
     *
     * These counts are based on the
     * current search/filter.
     */
    const totalRecords = filteredAttendance.length;

    const presentCount = filteredAttendance.filter(
        (record) =>
            record.status?.toLowerCase() === "present"
    ).length;

    const absentCount = filteredAttendance.filter(
        (record) =>
            record.status?.toLowerCase() === "absent"
    ).length;

    const attendanceRate =
        totalRecords > 0
            ? Math.round(
                  (presentCount / totalRecords) * 100
              )
            : 0;

    /*
     * CLEAR SEARCH
     */
    function clearFilters() {
        setCourseSearch("");
        setLecturerSearch("");
        setDateSearch("");
    }

    const hasFilters =
        courseSearch !== "" ||
        lecturerSearch !== "" ||
        dateSearch !== "";

    return (
        <DashboardLayout
            title="Attendance"
            role="student"
        >
            <div className="student-attendance-page">

                {/* =========================
                    PAGE HEADER
                ========================== */}
                <div className="student-attendance-heading">

                    <div>
                        <h1>Attendance</h1>

                        <p>
                            View and search your attendance records.
                        </p>
                    </div>

                </div>


                {loading ? (

                    /* =========================
                       LOADING
                    ========================== */
                    <div className="attendance-loading">
                        Loading attendance...
                    </div>

                ) : (

                    <>

                        {/* =========================
                            ATTENDANCE SUMMARY
                        ========================== */}
                        <div className="attendance-summary">

                            {/* TOTAL */}
                            <div className="attendance-summary-card">

                                <div className="attendance-summary-icon total-icon">
                                    <FaChartPie />
                                </div>

                                <div className="attendance-summary-content">
                                    <span>
                                        Total Records
                                    </span>

                                    <strong>
                                        {totalRecords}
                                    </strong>
                                </div>

                            </div>


                            {/* PRESENT */}
                            <div className="attendance-summary-card">

                                <div className="attendance-summary-icon present-icon">
                                    <FaCheckCircle />
                                </div>

                                <div className="attendance-summary-content">
                                    <span>
                                        Present
                                    </span>

                                    <strong>
                                        {presentCount}
                                    </strong>
                                </div>

                            </div>


                            {/* ABSENT */}
                            <div className="attendance-summary-card">

                                <div className="attendance-summary-icon absent-icon">
                                    <FaTimesCircle />
                                </div>

                                <div className="attendance-summary-content">
                                    <span>
                                        Absent
                                    </span>

                                    <strong>
                                        {absentCount}
                                    </strong>
                                </div>

                            </div>


                            {/* ATTENDANCE RATE */}
                            <div className="attendance-summary-card">

                                <div className="attendance-summary-icon rate-icon">
                                    <FaChartPie />
                                </div>

                                <div className="attendance-summary-content">
                                    <span>
                                        Attendance Rate
                                    </span>

                                    <strong>
                                        {attendanceRate}%
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* =========================
                            SEARCH AND FILTERS
                        ========================== */}
                        <div className="attendance-filters">

                            <div className="attendance-filter-header">

                                <div className="attendance-filter-header-icon">
                                    <FaSearch />
                                </div>

                                <div>
                                    <h3>
                                        Search Attendance
                                    </h3>

                                    <p>
                                        Search by course, lecturer or date.
                                    </p>
                                </div>

                            </div>


                            <div className="attendance-filter-grid">

                                {/* COURSE SEARCH */}
                                <div className="attendance-filter-field">

                                    <label>
                                        Course
                                    </label>

                                    <div className="attendance-input-wrapper">

                                        <FaBook />

                                        <input
                                            type="text"
                                            placeholder="Search course or code..."
                                            value={courseSearch}
                                            onChange={(e) =>
                                                setCourseSearch(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* LECTURER SEARCH */}
                                <div className="attendance-filter-field">

                                    <label>
                                        Lecturer
                                    </label>

                                    <div className="attendance-input-wrapper">

                                        <FaUserTie />

                                        <input
                                            type="text"
                                            placeholder="Search lecturer..."
                                            value={lecturerSearch}
                                            onChange={(e) =>
                                                setLecturerSearch(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* DATE SEARCH */}
                                <div className="attendance-filter-field">

                                    <label>
                                        Date
                                    </label>

                                    <div className="attendance-input-wrapper">

                                        <FaCalendarAlt />

                                        <input
                                            type="date"
                                            value={dateSearch}
                                            onChange={(e) =>
                                                setDateSearch(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>


                                {/* CLEAR BUTTON */}
                                <div className="attendance-filter-button-container">

                                    {hasFilters && (
                                        <button
                                            type="button"
                                            className="attendance-clear-button"
                                            onClick={clearFilters}
                                        >
                                            <FaTimesCircle />
                                            Clear Filters
                                        </button>
                                    )}

                                </div>

                            </div>

                        </div>


                        {/* =========================
                            NO RECORDS AT ALL
                        ========================== */}
                        {attendance.length === 0 ? (

                            <div className="attendance-empty">

                                <div className="attendance-empty-icon">
                                    <FaChartPie />
                                </div>

                                <h3>
                                    No attendance records
                                </h3>

                                <p>
                                    You do not have any attendance
                                    records yet.
                                </p>

                            </div>

                        ) : filteredAttendance.length === 0 ? (

                            /* =========================
                               NO SEARCH RESULTS
                            ========================== */
                            <div className="attendance-empty">

                                <div className="attendance-empty-icon">
                                    <FaSearch />
                                </div>

                                <h3>
                                    No matching records
                                </h3>

                                <p>
                                    No attendance records match
                                    your current search.
                                </p>

                                <button
                                    type="button"
                                    className="attendance-empty-button"
                                    onClick={clearFilters}
                                >
                                    Clear Search
                                </button>

                            </div>

                        ) : (

                            /* =========================
                               ATTENDANCE TABLE
                            ========================== */
                            <div className="student-attendance-table-container">

                                <table className="student-attendance-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Course
                                            </th>

                                            <th>
                                                Course Code
                                            </th>

                                            <th>
                                                Lecturer
                                            </th>

                                            <th>
                                                Date
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {filteredAttendance.map(
                                            (record) => {

                                                const courseName =
                                                    record.course
                                                        ?.courseName ||
                                                    record.course
                                                        ?.name ||
                                                    "N/A";

                                                const courseCode =
                                                    record.course
                                                        ?.courseCode ||
                                                    record.course
                                                        ?.code ||
                                                    "N/A";

                                                const lecturerName =
                                                    record.lecturer
                                                        ?.name ||
                                                    "N/A";

                                                const recordDate =
                                                    record.createdAt ||
                                                    record.scannedAt ||
                                                    record.date;

                                                const status =
                                                    record.status ||
                                                    "N/A";

                                                return (

                                                    <tr
                                                        key={
                                                            record._id ||
                                                            record.id
                                                        }
                                                    >

                                                        <td className="course-name">
                                                            {courseName}
                                                        </td>

                                                        <td className="course-code">
                                                            {courseCode}
                                                        </td>

                                                        <td>
                                                            {lecturerName}
                                                        </td>

                                                        <td>
                                                            {recordDate
                                                                ? new Date(
                                                                      recordDate
                                                                  ).toLocaleDateString(
                                                                      undefined,
                                                                      {
                                                                          year: "numeric",
                                                                          month: "short",
                                                                          day: "numeric"
                                                                      }
                                                                  )
                                                                : "N/A"}
                                                        </td>

                                                        <td>

                                                            <span
                                                                className={
                                                                    status.toLowerCase() ===
                                                                    "present"
                                                                        ? "attendance-present"
                                                                        : "attendance-absent"
                                                                }
                                                            >
                                                                {status}
                                                            </span>

                                                        </td>

                                                    </tr>

                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </>

                )}

            </div>

        </DashboardLayout>
    );
}

export default Attendance;