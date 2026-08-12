import { useState, useEffect } from "react";
import { FaQrcode, FaClock } from "react-icons/fa";
import QRCode from "qrcode";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";



import "../../styles/generateQR.css";

function StartAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [duration, setDuration] = useState("15");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [qrError, setQrError] = useState("");
  const [apiError, setApiError] = useState("");

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Generate QR code whenever session changes
  useEffect(() => {
    if (!session) {
      setQrSrc("");
      setQrError("");
      return;
    }

    const qrToken =
      session.qrToken ||
      session.token ||
      session.qr_token ||
      session.attendanceToken ||
      session.sessionToken ||
      session.code;

    if (!qrToken) {
      console.log("StartAttendance: session object has no QR token", session);
      setQrSrc("");
      setQrError("No QR token found in server response. Check the console for session details.");
      return;
    }

    QRCode.toDataURL(qrToken)
      .then((url) => {
        setQrSrc(url);
        setQrError("");
      })
      .catch((error) => {
        console.error("QR code generation failed", error);
        setQrSrc("");
        setQrError("QR code generation failed. See console for details.");
      });
  }, [session]);

  async function loadCourses() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`${API_URL}/api/course-assignments/lecturer/${user.id}`);
      const data = await response.json();
      setCourses(data.assignments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQR(e) {
    e.preventDefault();

    if (!selectedCourse) {
      alert("Please select a course.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/attendance-sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseAssignmentId: selectedCourse, duration }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Failed to start attendance session.");
        return;
      }

      setApiError("");
      setSession(data.session);
    } catch (error) {
      console.log(error);
    }
  }

  async function stopAttendance() {
    try {
      const response = await fetch(`${API_URL}/api/attendance-sessions/close/${session._id}`, {
        method: "PUT",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Attendance Closed Successfully");
      setSession(null);
      setQrSrc("");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <DashboardLayout title="Generate QR Code" role="lecturer">
      <PageHeader
        title="Generate Attendance QR Code"
        subtitle="Create a temporary QR code for students to mark attendance."
      />

      <div className="qr-page">
        <div className="qr-form-card">
          <div className="qr-form-icon">
            <FaQrcode />
          </div>

          <h2>Create Attendance Session</h2>
          <p>Enter the class information and generate a QR code.</p>

          <form onSubmit={handleGenerateQR}>
            {/* Course selection */}
            <div className="form-group">
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.course.courseName} ({course.course.courseCode}) - {course.semester}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration selection */}
            <div className="form-group">
              <label>
                <FaClock /> QR Expiry Time
              </label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>

            {/* QR Display */}
            {session && (
              <div className="qr-display">
                <h2>Attendance QR Code</h2>
                {qrSrc ? (
                  <img src={qrSrc} alt="Attendance QR" width={250} height={250} />
                ) : (
                  <p>{qrError || "Loading QR code…"}</p>
                )}
                <p>Status: {session.status}</p>
                {qrError && <p className="error-text">{qrError}</p>}
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div className="error-text">
                <p>{apiError}</p>
              </div>
            )}

            
            {session ? (
              <button type="button" className="generate-qr-btn" onClick={stopAttendance}>
                Stop Attendance
              </button>
            ) : (
              <button type="submit" className="generate-qr-btn">
                Generate QR Code
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StartAttendance;
