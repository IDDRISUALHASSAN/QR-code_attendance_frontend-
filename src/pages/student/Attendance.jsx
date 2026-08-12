import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/studentAttendance.css";
import API_URL from "../../config/api";
function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
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

  return (
    <DashboardLayout
      title="Attendance"
      role="student"
    >

      <div className="student-attendance-page">

        

        <div className="student-attendance-heading">

          <h1>Attendance</h1>

          <p>
            View your attendance records.
          </p>

        </div>


    

        {loading ? (

          <div className="attendance-loading">
            Loading attendance...
          </div>

        ) : attendance.length === 0 ? (

          /* EMPTY */

          <div className="attendance-empty">

            <h3>No attendance records</h3>

            <p>
              You do not have any attendance records yet.
            </p>

          </div>

        ) : (

          /* TABLE */

          <div className="student-attendance-table-container">

            <table className="student-attendance-table">

              <thead>

                <tr>
                  <th>Course</th>
                  <th>Course Code</th>
                  <th>Lecturer</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>

              </thead>


              <tbody>

                {attendance.map((record) => (

                  <tr key={record.id}>

                    <td className="course-name">
                      {record.course?.courseName || "N/A"}
                    </td>


                    <td className="course-code">
                      {record.course?.courseCode || "N/A"}
                    </td>


                    <td>
                      {record.lecturer?.name || "N/A"}
                    </td>


                    <td>
                      {record.createdAt
                        ? new Date(
                            record.createdAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>


                    <td>

                      <span
                        className={
                          record.status === "Present"
                            ? "attendance-present"
                            : "attendance-absent"
                        }
                      >
                        {record.status || "N/A"}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

export default Attendance;