import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import "../../styles/attendanceDetails.css";

function AttendanceDetails() {
  const { sessionId } = useParams();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      const response = await fetch(`/api/attendance/session/${sessionId}`);
      const data = await response.json();
      setAttendance(data.attendance || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // Filter attendance based on search
  const filteredAttendance = attendance.filter(
    (record) =>
      record.student.name.toLowerCase().includes(search.toLowerCase()) ||
      record.student.indexNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Attendance Details" role="lecturer">
      <PageHeader
        title="Attendance Details"
        subtitle="Students who attended this session."
      />

      {loading ? (
        <h2>Loading...</h2>
      ) : attendance.length === 0 ? (
        <h2>No Students Found</h2>
      ) : (
        <>
          {/* Search input */}
          <input
            type="text"
            placeholder="Search by name or index number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          {/* Attendance table */}
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Index Number</th>
                <th>Email</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record._id}>
                  <td>{record.student.name}</td>
                  <td>{record.student.indexNumber}</td>
                  <td>{record.student.email}</td>
                  <td>
                    <span
                      className={
                        record.status === "Present"
                          ? "status-present"
                          : "status-absent"
                      }
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {new Date(record.scannedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </DashboardLayout>
  );
}

export default AttendanceDetails;
