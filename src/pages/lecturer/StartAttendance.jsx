import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";

import {
  FaQrcode,
  FaClock,
  FaMapMarkerAlt,
  FaSpinner,
  FaCheckCircle,
  FaUsers,
} from "react-icons/fa";

import QRCode from "qrcode";

import DashboardLayout from "../../layouts/DashboardLayout";

import PageHeader from "../../components/PageHeader";

import API_URL from "../../config/api";

import "../../styles/generateQR.css";

function StartAttendance() {
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  // =========================================================
  // CLASS SELECTION
  // =========================================================
  const [selectedClass, setSelectedClass] = useState("");

  const classOptions = [
    "Class A",
    "Class B",
    "Class C",
    "Class D",
    "Class E",
  ];

  // Lecturer enters attendance duration manually.
  const [duration, setDuration] = useState("15");

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [qrError, setQrError] = useState("");
  const [apiError, setApiError] = useState("");

  // GPS states
  const [gettingLocation, setGettingLocation] =
    useState(false);

  const [lecturerLocation, setLecturerLocation] =
    useState(null);

  // Attendance countdown
  const [remainingSeconds, setRemainingSeconds] =
    useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (location.state?.selectedCourse) {
      setSelectedCourse(
        location.state.selectedCourse
      );
    }

    if (location.state?.selectedClass) {
      setSelectedClass(
        location.state.selectedClass
      );
    }
  }, [location.state]);

  // ---------------------------------------------------------
  // Generate QR code when session is available
  // ---------------------------------------------------------
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
      setQrError(
        "No QR token was returned by the server."
      );
      return;
    }

    QRCode.toDataURL(qrToken)
      .then((url) => {
        setQrSrc(url);
        setQrError("");
      })
      .catch((error) => {
        console.error(
          "QR code generation failed:",
          error
        );

        setQrSrc("");
        setQrError(
          "QR code generation failed."
        );
      });
  }, [session]);

  // ---------------------------------------------------------
  // AUTOMATIC SESSION COUNTDOWN
  // ---------------------------------------------------------
  useEffect(() => {
    if (
      !session ||
      !session.endTime
    ) {
      setRemainingSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();

      const end = new Date(
        session.endTime
      ).getTime();

      const difference =
        end - now;

      if (difference <= 0) {
        setRemainingSeconds(0);

        // Automatically close the attendance session.
        autoCloseAttendance();

        return;
      }

      setRemainingSeconds(
        Math.ceil(difference / 1000)
      );
    };

    updateCountdown();

    const timer = setInterval(
      updateCountdown,
      1000
    );

    return () => {
      clearInterval(timer);
    };
  }, [session]);

  // ---------------------------------------------------------
  // AUTOMATICALLY CLOSE ATTENDANCE
  // ---------------------------------------------------------
  async function autoCloseAttendance() {
    if (!session?._id) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/attendance-sessions/close/${session._id}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Automatic session close failed:",
          data.message
        );

        return;
      }

      console.log(
        "Attendance session automatically closed."
      );

      setSession(null);
      setQrSrc("");
      setQrError("");
      setRemainingSeconds(null);
      setLecturerLocation(null);
      setSelectedCourse("");
      setSelectedClass("");

      setApiError(
        "Attendance session ended automatically."
      );
    } catch (error) {
      console.error(
        "Automatic session close error:",
        error
      );
    }
  }

  // ---------------------------------------------------------
  // FORMAT REMAINING TIME
  // ---------------------------------------------------------
  function formatRemainingTime(
    seconds
  ) {
    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "--";
    }

    const hours =
      Math.floor(seconds / 3600);

    const minutes =
      Math.floor(
        (seconds % 3600) / 60
      );

    const secs =
      seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  }

  // ---------------------------------------------------------
  // Load lecturer assigned courses
  // ---------------------------------------------------------
  async function loadCourses() {
    try {
      setLoading(true);
      setApiError("");

      const user = (() => {
        try {
          return JSON.parse(
            localStorage.getItem("user") ||
              "null"
          );
        } catch {
          return null;
        }
      })();

      if (!user?.id) {
        throw new Error(
          "Lecturer account information was not found."
        );
      }

      const response = await fetch(
        `${API_URL}/api/course-assignments/lecturer/${user.id}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load assigned courses."
        );
      }

      setCourses(
        data.assignments || []
      );
    } catch (error) {
      console.error(
        "Error loading assigned courses:",
        error
      );

      setCourses([]);

      setApiError(
        error.message ||
          "Unable to load assigned courses."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // GET LECTURER GPS LOCATION
  // ---------------------------------------------------------
  function getLecturerLocation() {
    return new Promise(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          reject(
            new Error(
              "GPS is not supported by this browser or device."
            )
          );

          return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGettingLocation(false);

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            const accuracy =
              position.coords.accuracy;

            // Make sure coordinates are valid
            if (
              !Number.isFinite(
                latitude
              ) ||
              !Number.isFinite(
                longitude
              )
            ) {
              reject(
                new Error(
                  "The browser returned an invalid GPS location."
                )
              );

              return;
            }

            const locationData = {
              latitude,
              longitude,
              accuracy,
            };

            setLecturerLocation(
              locationData
            );

            console.log(
              "Lecturer GPS location:",
              locationData
            );

            resolve(
              locationData
            );
          },

          (error) => {
            setGettingLocation(
              false
            );

            console.error(
              "Lecturer GPS error:",
              error
            );

            let errorMessage =
              "Unable to detect your location.";

            // Permission denied
            if (error.code === 1) {
              errorMessage =
                "Location permission was denied. Please allow location access in your browser settings and try again.";
            }

            // Position unavailable
            else if (
              error.code === 2
            ) {
              errorMessage =
                "Your location could not be detected. Please turn on Location/GPS on your device and try again.";
            }

            // Timeout
            else if (
              error.code === 3
            ) {
              errorMessage =
                "Location detection timed out. Please make sure Location/GPS is enabled and try again.";
            }

            reject(
              new Error(
                errorMessage
              )
            );
          },

          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          }
        );
      }
    );
  }

  // ---------------------------------------------------------
  // Check browser location permission
  // ---------------------------------------------------------
  async function checkLocationPermission() {
    if (!navigator.permissions) {
      return "unknown";
    }

    try {
      const permission =
        await navigator.permissions.query(
          {
            name: "geolocation",
          }
        );

      console.log(
        "Location permission:",
        permission.state
      );

      return permission.state;
    } catch (error) {
      console.log(
        "Location permission status unavailable:",
        error
      );

      return "unknown";
    }
  }

  // ---------------------------------------------------------
  // GENERATE ATTENDANCE QR
  // ---------------------------------------------------------
  async function handleGenerateQR(e) {
    e.preventDefault();

    setApiError("");

    if (!selectedCourse) {
      setApiError(
        "Please select a course."
      );
      return;
    }

    // =======================================================
    // VALIDATE CLASS
    // =======================================================
    if (!selectedClass) {
      setApiError(
        "Please select a class."
      );
      return;
    }

    // ==========================================
    // VALIDATE DURATION
    // ==========================================

    const durationMinutes =
      Number(duration);

    if (
      !Number.isInteger(
        durationMinutes
      ) ||
      durationMinutes < 1
    ) {
      setApiError(
        "Please enter a valid attendance duration in minutes."
      );
      return;
    }

    try {
      // -----------------------------------------------------
      // STEP 1: Check location permission
      // -----------------------------------------------------
      const permission =
        await checkLocationPermission();

      console.log(
        "Current browser location permission:",
        permission
      );

      if (
        permission === "denied"
      ) {
        setApiError(
          "Location permission is blocked for this website. Please allow Location permission in your browser/site settings, then reload the page and try again."
        );

        return;
      }

      // -----------------------------------------------------
      // STEP 2: Get lecturer's current GPS
      // -----------------------------------------------------
      setGettingLocation(true);

      setApiError(
        "Detecting your current location. Please allow location access if your browser asks..."
      );

      let locationData;

      try {
        locationData =
          await getLecturerLocation();
      } catch (
        locationError
      ) {
        setGettingLocation(
          false
        );

        setApiError(
          locationError.message ||
            "Unable to detect your location."
        );

        return;
      }

      setGettingLocation(false);

      // -----------------------------------------------------
      // STEP 3: Validate GPS
      // -----------------------------------------------------
      if (
        !locationData ||
        !Number.isFinite(
          locationData.latitude
        ) ||
        !Number.isFinite(
          locationData.longitude
        )
      ) {
        setApiError(
          "A valid lecturer location could not be detected."
        );

        return;
      }

      console.log(
        "Valid lecturer location:",
        locationData
      );

      // -----------------------------------------------------
      // STEP 4: Start attendance session
      // -----------------------------------------------------
      setApiError(
        "Location detected. Starting attendance session..."
      );

      const response =
        await fetch(
          `${API_URL}/api/attendance-sessions/start`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${localStorage.getItem(
                "token"
              )}`,
            },

            body: JSON.stringify({
              courseAssignmentId:
                selectedCourse,

              // =================================================
              // CLASS
              // =================================================
              className:
                selectedClass,

              // Lecturer-entered duration
              duration:
                durationMinutes,

              // Lecturer GPS
              lecturerLatitude:
                locationData.latitude,

              lecturerLongitude:
                locationData.longitude,

              lecturerAccuracy:
                locationData.accuracy,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setApiError(
          data.message ||
            "Failed to start attendance session."
        );

        return;
      }

      // -----------------------------------------------------
      // STEP 5: Session successfully created
      // -----------------------------------------------------
      setSession(
        data.session || data
      );

      setApiError("");
    } catch (error) {
      console.error(
        "Generate QR error:",
        error
      );

      setGettingLocation(
        false
      );

      setApiError(
        error.message ||
          "Unable to connect to the server."
      );
    }
  }

  // ---------------------------------------------------------
  // STOP ATTENDANCE MANUALLY
  // ---------------------------------------------------------
  async function stopAttendance() {
    if (!session?._id) {
      return;
    }

    try {
      setApiError("");

      const response =
        await fetch(
          `${API_URL}/api/attendance-sessions/close/${session._id}`,
          {
            method: "PUT",

            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "token"
              )}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setApiError(
          data.message ||
            "Failed to close attendance."
        );

        return;
      }

      alert(
        "Attendance Closed Successfully"
      );

      setSession(null);
      setQrSrc("");
      setQrError("");
      setRemainingSeconds(null);
      setSelectedCourse("");
      setSelectedClass("");
      setLecturerLocation(null);
    } catch (error) {
      console.error(
        "Stop attendance error:",
        error
      );

      setApiError(
        "Unable to connect to the server."
      );
    }
  }

  return (
    <DashboardLayout
      title="Generate QR Code"
      role="lecturer"
    >
      <PageHeader
        title="Generate Attendance QR Code"
        subtitle="Create a temporary QR code for students to mark attendance."
      />

      <div className="qr-page">
        <div className="qr-form-card">
          <div className="qr-form-icon">
            <FaQrcode />
          </div>

          <h2>
            Create Attendance Session
          </h2>

          <p>
            Select a course, class and
            attendance duration.
          </p>

          <form
            onSubmit={
              handleGenerateQR
            }
          >
            {/* COURSE */}
            <div className="form-group">
              <label>
                Course
              </label>

              <select
                value={
                  selectedCourse
                }
                onChange={(e) =>
                  setSelectedCourse(
                    e.target.value
                  )
                }
                disabled={
                  loading ||
                  courses.length ===
                    0 ||
                  !!session ||
                  gettingLocation
                }
              >
                <option value="">
                  {loading
                    ? "Loading courses..."
                    : courses.length ===
                      0
                    ? "No assigned courses"
                    : "Select Course"}
                </option>

                {courses.map(
                  (assignment) => (
                    <option
                      key={
                        assignment._id
                      }
                      value={
                        assignment._id
                      }
                    >
                      {assignment
                        .course
                        ?.courseName ||
                        "Course"}{" "}
                      (
                      {assignment
                        .course
                        ?.courseCode ||
                        "N/A"}
                      ) -{" "}
                      {assignment.semester ||
                        "Semester"}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* CLASS */}
            <div className="form-group">
              <label>
                <FaUsers /> Class
              </label>

              <select
                value={
                  selectedClass
                }
                onChange={(e) =>
                  setSelectedClass(
                    e.target.value
                  )
                }
                disabled={
                  !!session ||
                  gettingLocation
                }
              >
                <option value="">
                  Select Class
                </option>

                {classOptions.map(
                  (className) => (
                    <option
                      key={
                        className
                      }
                      value={
                        className
                      }
                    >
                      {className}
                    </option>
                  )
                )}
              </select>

              <small
                style={{
                  display:
                    "block",
                  marginTop:
                    "6px",
                  color: "#666",
                }}
              >
                Select the class
                whose attendance
                you are taking.
              </small>
            </div>

            {/* DURATION */}
            <div className="form-group">
              <label>
                <FaClock /> Attendance
                Duration
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    duration
                  }
                  onChange={(e) =>
                    setDuration(
                      e.target.value
                    )
                  }
                  disabled={
                    !!session ||
                    gettingLocation
                  }
                  placeholder="Enter minutes"
                />

                <span
                  style={{
                    fontSize:
                      "14px",
                  }}
                >
                  minutes
                </span>
              </div>

              <small
                style={{
                  display:
                    "block",
                  marginTop:
                    "6px",
                  color: "#666",
                }}
              >
                Enter how many
                minutes the
                attendance should
                remain open.
              </small>
            </div>

            {/* GPS STATUS */}
            {gettingLocation && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  borderRadius: "10px",
                  background:
                    "#f3f7ff",
                  border:
                    "1px solid #d8e5ff",
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                }}
              >
                <FaSpinner className="gps-spinner" />

                <div>
                  <strong>
                    Detecting your
                    location...
                  </strong>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize:
                        "13px",
                    }}
                  >
                    Please allow
                    location
                    permission if
                    your browser
                    asks.
                  </p>
                </div>
              </div>
            )}

            {/* GPS SUCCESS */}
            {lecturerLocation &&
              !gettingLocation &&
              !session && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    borderRadius: "10px",
                    background:
                      "#f0fff4",
                    border:
                      "1px solid #b7ebc6",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "8px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    <FaCheckCircle />

                    <strong>
                      Location
                      detected
                    </strong>
                  </div>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      lineHeight:
                        "1.7",
                    }}
                  >
                    <div>
                      Latitude:{" "}
                      {lecturerLocation.latitude.toFixed(
                        6
                      )}
                    </div>

                    <div>
                      Longitude:{" "}
                      {lecturerLocation.longitude.toFixed(
                        6
                      )}
                    </div>

                    <div>
                      Accuracy:
                      ±
                      {lecturerLocation.accuracy
                        ? lecturerLocation.accuracy.toFixed(
                            1
                          )
                        : "N/A"}{" "}
                      m
                    </div>
                  </div>
                </div>
              )}

            {/* ERROR / STATUS */}
            {apiError && (
              <div className="error-text">
                <p>
                  {apiError}
                </p>
              </div>
            )}

            {/* QR DISPLAY */}
            {session && (
              <div className="qr-display">
                <h2>
                  Attendance QR Code
                </h2>

                {/* SESSION CLASS */}
                <div
                  style={{
                    marginBottom:
                      "15px",
                    padding:
                      "10px 14px",
                    borderRadius:
                      "8px",
                    background:
                      "#f3f7ff",
                    border:
                      "1px solid #d8e5ff",
                    textAlign:
                      "center",
                  }}
                >
                  <strong>
                    {session.className ||
                      selectedClass}
                  </strong>
                </div>

                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt="Attendance QR Code"
                    width={250}
                    height={250}
                  />
                ) : (
                  <p>
                    {qrError ||
                      "Generating QR code..."}
                  </p>
                )}

                <p>
                  Status:{" "}
                  <strong>
                    {session.status ||
                      "Active"}
                  </strong>
                </p>

                {/* COUNTDOWN */}
                {remainingSeconds !==
                    null && (
                  <div
                    style={{
                      marginTop:
                        "15px",
                      padding:
                        "14px",
                      borderRadius:
                        "10px",
                      background:
                        "#fff8e6",
                      border:
                        "1px solid #f2d58a",
                      textAlign:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "center",
                        alignItems:
                          "center",
                        gap: "8px",
                        marginBottom:
                          "5px",
                      }}
                    >
                      <FaClock />

                      <strong>
                        Time Remaining
                      </strong>
                    </div>

                    <div
                      style={{
                        fontSize:
                          "24px",
                        fontWeight:
                          "700",
                      }}
                    >
                      {formatRemainingTime(
                        remainingSeconds
                      )}
                    </div>

                    <small>
                      Attendance will
                      automatically
                      close when the
                      timer reaches
                      zero.
                    </small>
                  </div>
                )}

                {/* Lecturer GPS used for this session */}
                {session.lecturerLatitude !==
                    undefined &&
                  session.lecturerLongitude !==
                    undefined && (
                    <div
                      style={{
                        marginTop:
                          "15px",
                        padding:
                          "12px",
                        borderRadius:
                          "8px",
                        background:
                          "#f5f5f5",
                        fontSize:
                          "13px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "7px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        <FaMapMarkerAlt />

                        <strong>
                          Lecturer
                          Location
                        </strong>
                      </div>

                      <div>
                        Latitude:{" "}
                        {Number(
                          session.lecturerLatitude
                        ).toFixed(
                          6
                        )}
                      </div>

                      <div>
                        Longitude:{" "}
                        {Number(
                          session.lecturerLongitude
                        ).toFixed(
                          6
                        )}
                      </div>
                    </div>
                  )}

                {qrError && (
                  <p className="error-text">
                    {qrError}
                  </p>
                )}
              </div>
            )}

            {/* BUTTON */}
            {session ? (
              <button
                type="button"
                className="generate-qr-btn"
                onClick={
                  stopAttendance
                }
              >
                Stop Attendance
              </button>
            ) : (
              <button
                type="submit"
                className="generate-qr-btn"
                disabled={
                  loading ||
                  !selectedCourse ||
                  !selectedClass ||
                  gettingLocation
                }
              >
                {gettingLocation ? (
                  <>
                    <FaSpinner className="gps-spinner" />
                    Detecting
                    Location...
                  </>
                ) : (
                  <>
                    <FaMapMarkerAlt />
                    Generate QR
                    Code
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StartAttendance;