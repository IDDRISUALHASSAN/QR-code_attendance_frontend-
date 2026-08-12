import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/adminReports.css";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import API_URL from "../../config/api";


function Reports() {
  const [attendance, setAttendance] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  

  useEffect(() => {
    loadAttendance();
  }, []);

  
  async function loadAttendance() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/attendance/report`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });


      if (!response.ok) {
        throw new Error("Failed to fetch attendance report");
      }

      const data = await response.json();

      setAttendance(data.attendance || []);
    } catch (error) {
      console.error("Error loading attendance report:", error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString();
  }

  function formatTime(date) {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getLocalDateString(date) {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const filteredAttendance = attendance.filter((record) => {
    const searchValue = search.trim().toLowerCase();

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

    const matchesDate =
      !dateFilter ||
      getLocalDateString(record.scannedAt) === dateFilter;

    const matchesCourse =
      !courseFilter ||
      record.course?._id === courseFilter;

    const recordStatus = record.status || "Present";

    const matchesStatus =
      !statusFilter ||
      recordStatus === statusFilter;

    return (
      matchesSearch &&
      matchesDate &&
      matchesCourse &&
      matchesStatus
    );
  });

  const totalRecords = attendance.length;

  const today = new Date();

  const todayDateString = getLocalDateString(today);

  const todayRecords = attendance.filter(
    (record) =>
      getLocalDateString(record.scannedAt) === todayDateString
  ).length;

  const totalStudents = new Set(
    attendance
      .filter((record) => record.student?._id)
      .map((record) => record.student._id)
  ).size;

  const totalCourses = new Set(
    attendance
      .filter((record) => record.course?._id)
      .map((record) => record.course._id)
  ).size;


  function clearFilters() {
    setSearch("");
    setDateFilter("");
    setCourseFilter("");
    setStatusFilter("");
  }

  function exportPDF() {
    if (filteredAttendance.length === 0) {
      alert("There are no attendance records to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Report", 14, 18);

    // Generated date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      25
    );

    // Filter information
    let filterText = "Filters: All Records";

    if (
      search ||
      dateFilter ||
      courseFilter ||
      statusFilter
    ) {
      const filters = [];

      if (search) {
        filters.push(`Search: ${search}`);
      }

      if (dateFilter) {
        filters.push(`Date: ${dateFilter}`);
      }

      if (courseFilter) {
        const selectedCourse = attendance.find(
          (record) =>
            record.course?._id === courseFilter
        )?.course;

        if (selectedCourse) {
          filters.push(
            `Course: ${selectedCourse.courseCode}`
          );
        }
      }

      if (statusFilter) {
        filters.push(`Status: ${statusFilter}`);
      }

      filterText = `Filters: ${filters.join(" | ")}`;
    }

    doc.text(filterText, 14, 31);

    // Table configuration
    const columns = [
      {
        title: "#",
        width: 10,
      },
      {
        title: "Student",
        width: 42,
      },
      {
        title: "Index Number",
        width: 35,
      },
      {
        title: "Course",
        width: 35,
      },
      {
        title: "Lecturer",
        width: 42,
      },
      {
        title: "Date",
        width: 28,
      },
      {
        title: "Time",
        width: 25,
      },
      {
        title: "Status",
        width: 25,
      },
    ];

    const startX = 10;
    let y = 40;
    const rowHeight = 8;

    // Draw table header
    function drawHeader() {
      let x = startX;

      doc.setFillColor(41, 98, 255);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");

      columns.forEach((column) => {
        doc.rect(
          x,
          y,
          column.width,
          rowHeight,
          "F"
        );

        doc.text(
          column.title,
          x + 2,
          y + 5
        );

        x += column.width;
      });

      doc.setTextColor(0, 0, 0);

      y += rowHeight;
    }

    drawHeader();

    // Draw rows
    filteredAttendance.forEach((record, index) => {
      // Add new page when needed
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 15;
        drawHeader();
      }

      const rowData = [
        String(index + 1),
        record.student?.name || "N/A",
        record.student?.indexNumber || "N/A",
        record.course?.courseCode || "N/A",
        record.lecturer?.name || "N/A",
        formatDate(record.scannedAt),
        formatTime(record.scannedAt),
        record.status || "Present",
      ];

      let x = startX;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      columns.forEach((column, columnIndex) => {
        // Alternate row color
        if (index % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(
            x,
            y,
            column.width,
            rowHeight,
            "F"
          );
        }

        doc.setDrawColor(210, 210, 210);
        doc.rect(
          x,
          y,
          column.width,
          rowHeight
        );

        const value = rowData[columnIndex];

        const text = doc.splitTextToSize(
          value,
          column.width - 4
        );

        doc.text(
          text[0] || "",
          x + 2,
          y + 5
        );

        x += column.width;
      });

      y += rowHeight;
    });

    // Footer
    const totalPages =
      doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - 35,
        pageHeight - 8
      );
    }

    doc.save("attendance-report.pdf");
  }

  // =========================
  // EXPORT EXCEL
  // =========================
  function exportExcel() {
    if (filteredAttendance.length === 0) {
      alert("There are no attendance records to export.");
      return;
    }

    const excelData = filteredAttendance.map(
      (record, index) => ({
        "#": index + 1,
        Student:
          record.student?.name || "N/A",

        "Index Number":
          record.student?.indexNumber || "N/A",

        "Course Code":
          record.course?.courseCode || "N/A",

        "Course Name":
          record.course?.courseName || "N/A",

        Lecturer:
          record.lecturer?.name || "N/A",

        Date:
          formatDate(record.scannedAt),

        Time:
          formatTime(record.scannedAt),

        Status:
          record.status || "Present",
      })
    );

    // Create worksheet
    const worksheet =
      XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    // Create workbook
    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance"
    );

    // Create filename with date
    const currentDate =
      new Date()
        .toISOString()
        .split("T")[0];

    const filename =
      `attendance-report-${currentDate}.xlsx`;

    // Download Excel file
    XLSX.writeFile(
      workbook,
      filename
    );
  }

  // =========================
  // UNIQUE COURSES
  // =========================
  const uniqueCourses = [
    ...new Map(
      attendance
        .filter(
          (record) =>
            record.course?._id
        )
        .map((record) => [
          record.course._id,
          record.course,
        ])
    ).values(),
  ];

  // =========================
  // RENDER
  // =========================
  return (
    <DashboardLayout
      title="Attendance Reports"
      role="admin"
    >
      <div className="reports-page">

        {/* PAGE HEADING */}
        <div className="page-heading">

          <div>
            <h1>
              Attendance Reports
            </h1>

            <p>
              View and monitor attendance
              records across the system.
            </p>
          </div>

          <div className="export-buttons">

            <button
              type="button"
              className="export-pdf-btn"
              onClick={exportPDF}
              disabled={
                loading ||
                filteredAttendance.length === 0
              }
            >
              📄 Export PDF
            </button>

            <button
              type="button"
              className="export-excel-btn"
              onClick={exportExcel}
              disabled={
                loading ||
                filteredAttendance.length === 0
              }
            >
              📊 Export Excel
            </button>

          </div>

        </div>

        {/* REPORT CARDS */}
        <div className="report-cards">

          <div className="report-card">
            <div className="report-card-icon">
              📊
            </div>

            <div>
              <span>
                Total Records
              </span>

              <strong>
                {totalRecords}
              </strong>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-icon">
              📅
            </div>

            <div>
              <span>
                Today
              </span>

              <strong>
                {todayRecords}
              </strong>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-icon">
              👨‍🎓
            </div>

            <div>
              <span>
                Students
              </span>

              <strong>
                {totalStudents}
              </strong>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-icon">
              📚
            </div>

            <div>
              <span>
                Courses
              </span>

              <strong>
                {totalCourses}
              </strong>
            </div>
          </div>

        </div>

        {/* FILTERS */}
        <div className="report-filters">

          <input
            type="text"
            placeholder="Search student, course or lecturer..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <input
            type="date"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(e.target.value)
            }
          />

          <select
            value={courseFilter}
            onChange={(e) =>
              setCourseFilter(e.target.value)
            }
          >
            <option value="">
              All Courses
            </option>

            {uniqueCourses.map(
              (course) => (
                <option
                  key={course._id}
                  value={course._id}
                >
                  {course.courseCode} -{" "}
                  {course.courseName}
                </option>
              )
            )}
          </select>

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

          <button
            type="button"
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear
          </button>

        </div>

        {/* FILTER RESULT COUNT */}
        <div className="report-result-count">
          Showing{" "}
          <strong>
            {filteredAttendance.length}
          </strong>{" "}
          of{" "}
          <strong>
            {totalRecords}
          </strong>{" "}
          attendance records
        </div>

        {/* TABLE */}
        <div className="table-container">

          <table className="admin-table">

            <thead>
              <tr>
                <th>
                  Student
                </th>

                <th>
                  Index Number
                </th>

                <th>
                  Course
                </th>

                <th>
                  Lecturer
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

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="no-records"
                  >
                    Loading attendance
                    records...
                  </td>
                </tr>

              ) : filteredAttendance.length > 0 ? (

                filteredAttendance.map(
                  (record) => (

                    <tr
                      key={record._id}
                    >

                      <td>
                        {record.student?.name ||
                          "N/A"}
                      </td>

                      <td>
                        {record.student
                          ?.indexNumber ||
                          "N/A"}
                      </td>

                      <td>
                        <strong>
                          {record.course
                            ?.courseCode ||
                            "N/A"}
                        </strong>

                        <br />

                        <small>
                          {record.course
                            ?.courseName ||
                            "N/A"}
                        </small>
                      </td>

                      <td>
                        {record.lecturer
                          ?.name ||
                          "N/A"}
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
                          className={`status-active ${
                            (
                              record.status ||
                              "Present"
                            ).toLowerCase()
                          }`}
                        >
                          {record.status ||
                            "Present"}
                        </span>
                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>
                  <td
                    colSpan="7"
                    className="no-records"
                  >
                    No attendance records
                    found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Reports;