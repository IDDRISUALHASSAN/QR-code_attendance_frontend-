import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import "../../styles/attendanceDetails.css";
import API_URL from "../../config/api";

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
      const response = await fetch(`${API_URL}/api/attendance/session/${sessionId}`);
      const data = await response.json();
      setAttendance(data.attendance || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // Filter attendance based on search
                    const filteredAttendance = attendance.filter((record) => {
            const name = record.student?.name?.toLowerCase() || "";
            const indexNumber = record.student?.indexNumber?.toLowerCase() || "";

            return (
              name.includes(search.toLowerCase()) ||
              indexNumber.includes(search.toLowerCase())
            );
          });

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
                <tr key={record.id}>
                  <td>{record.student?.name || "N/A"}</td>
                        <td>{record.student?.indexNumber || "N/A"}</td>
                        <td>{record.student?.email || "N/A"}</td>
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
