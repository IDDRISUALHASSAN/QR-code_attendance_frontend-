import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { FaQrcode, FaClock } from "react-icons/fa";

import QRCode from "qrcode";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";

import API_URL from "../../config/api";

import "../../styles/generateQR.css";

function StartAttendance() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [duration, setDuration] = useState("15");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [qrError, setQrError] = useState("");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (location.state?.selectedCourse) {
      setSelectedCourse(location.state.selectedCourse);
    }
  }, [location.state]);

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
      setQrSrc("");
      setQrError("No QR token was returned by the server.");
      return;
    }

    QRCode.toDataURL(qrToken)
      .then((url) => {
        setQrSrc(url);
        setQrError("");
      })
      .catch((error) => {
        console.error("QR code generation failed:", error);
        setQrSrc("");
        setQrError("QR code generation failed.");
      });
  }, [session]);

  async function loadCourses() {
    try {
      setLoading(true);
      setApiError("");

      const user = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
          return null;
        }
      })();

      if (!user?.id) {
        throw new Error("Lecturer account information was not found.");
      }

      const response = await fetch(`${API_URL}/api/course-assignments/lecturer/${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load assigned courses.");
      }

      setCourses(data.assignments || []);
    } catch (error) {
      console.error("Error loading assigned courses:", error);
      setCourses([]);
      setApiError(error.message || "Unable to load assigned courses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQR(e) {
    e.preventDefault();
    setApiError("");

    if (!selectedCourse) {
      setApiError("Please select a course.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/attendance-sessions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          courseAssignmentId: selectedCourse,
          duration: Number(duration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Failed to start attendance session.");
        return;
      }

      setSession(data.session || data);
      setApiError("");
    } catch (error) {
      console.error("Generate QR error:", error);
      setApiError("Unable to connect to the server.");
    }
  }

  async function stopAttendance() {
    if (!session?._id) {
      return;
    }

    try {
      setApiError("");

      const response = await fetch(`${API_URL}/api/attendance-sessions/close/${session._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Failed to close attendance.");
        return;
      }

      alert("Attendance Closed Successfully");
      setSession(null);
      setQrSrc("");
      setQrError("");
      setSelectedCourse("");
    } catch (error) {
      console.error("Stop attendance error:", error);
      setApiError("Unable to connect to the server.");
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
          <p>Select one of your assigned courses and generate an attendance QR code.</p>

          <form onSubmit={handleGenerateQR}>
            <div className="form-group">
              <label>Course</label>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={loading || courses.length === 0 || !!session}
              >
                <option value="">
                  {loading
                    ? "Loading courses..."
                    : courses.length === 0
                      ? "No assigned courses"
                      : "Select Course"}
                </option>

                {courses.map((assignment) => (
                  <option key={assignment._id} value={assignment._id}>
                    {assignment.course?.courseName || "Course"} ({assignment.course?.courseCode || "N/A"}) - {assignment.semester || "Semester"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <FaClock /> QR Expiry Time
              </label>

              <select value={duration} onChange={(e) => setDuration(e.target.value)} disabled={!!session}>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>

            {apiError && (
              <div className="error-text">
                <p>{apiError}</p>
              </div>
            )}

            {session && (
              <div className="qr-display">
                <h2>Attendance QR Code</h2>

                {qrSrc ? (
                  <img src={qrSrc} alt="Attendance QR Code" width={250} height={250} />
                ) : (
                  <p>{qrError || "Generating QR code..."}</p>
                )}

                <p>
                  Status: <strong>{session.status || "Active"}</strong>
                </p>

                {qrError && <p className="error-text">{qrError}</p>}
              </div>
            )}

            {session ? (
              <button type="button" className="generate-qr-btn" onClick={stopAttendance}>
                Stop Attendance
              </button>
            ) : (
              <button type="submit" className="generate-qr-btn" disabled={loading || !selectedCourse}>
                <FaQrcode /> Generate QR Code
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StartAttendance;