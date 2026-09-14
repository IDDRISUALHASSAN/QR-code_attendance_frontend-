import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "../../styles/scanQR.css";
import {
  FaQrcode,
  FaLocationArrow,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
import API_URL from "../../config/api";

const ALLOWED_RADIUS = 3000000;

const DEVICE_STORAGE_KEY = "attendanceDeviceId";

// ============================================================
// CREATE / GET DEVICE ID
// ============================================================
const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);

    if (deviceId && deviceId.trim() !== "") {
      return deviceId;
    }

    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      deviceId = window.crypto.randomUUID();
    } else {
      deviceId =
        "device-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 15);
    }

    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);

    return deviceId;
  } catch (error) {
    console.error("Device ID error:", error);

    return (
      "device-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 15)
    );
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
function ScanQR() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const [gettingLocation, setGettingLocation] = useState(false);

  const [location, setLocation] = useState(null);

  const [locationError, setLocationError] = useState("");

  const [message, setMessage] = useState("");

  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const deviceIdRef = useRef(null);

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // ==========================================================
  // INITIALIZE DEVICE + LOCATION
  // ==========================================================
  useEffect(() => {
    const deviceId = getDeviceId();

    deviceIdRef.current = deviceId;

    // Get student's location when page loads
    getStudentLocation();

    return () => {
      deviceIdRef.current = null;
    };
  }, []);

  // ==========================================================
  // GET CURRENT DEVICE ID
  // ==========================================================
  const getCurrentDeviceId = () => {
    if (
      deviceIdRef.current &&
      typeof deviceIdRef.current === "string" &&
      deviceIdRef.current.trim() !== ""
    ) {
      return deviceIdRef.current;
    }

    const deviceId = getDeviceId();

    deviceIdRef.current = deviceId;

    return deviceId;
  };

  // ==========================================================
  // CHECK LOCATION PERMISSION
  // ==========================================================
  const checkLocationPermission = async () => {
    try {
      if (!navigator.permissions) {
        return "prompt";
      }

      const permission =
        await navigator.permissions.query({
          name: "geolocation",
        });

      return permission.state;
    } catch (error) {
      return "prompt";
    }
  };

  // ==========================================================
  // GET STUDENT LOCATION
  // ==========================================================
  const getStudentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMessage =
          "Geolocation is not supported by this device.";

        setLocationError(errorMessage);
        setGettingLocation(false);

        reject(new Error(errorMessage));
        return;
      }

      setGettingLocation(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const studentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setLocation(studentLocation);
          setLocationError("");
          setGettingLocation(false);

          console.log(
            "Student location:",
            studentLocation
          );

          resolve(studentLocation);
        },

        (error) => {
          setGettingLocation(false);

          let errorMessage =
            "Unable to get your current location.";

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            errorMessage =
              "Location permission is required. Please allow location access in your browser.";
          } else if (
            error.code ===
            error.POSITION_UNAVAILABLE
          ) {
            errorMessage =
              "Your current location could not be determined. Please check your device location settings.";
          } else if (
            error.code === error.TIMEOUT
          ) {
            errorMessage =
              "Getting your location took too long. Please try again.";
          }

          setLocationError(errorMessage);

          console.error(
            "Geolocation error:",
            error
          );

          reject(new Error(errorMessage));
        },

        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  };

  // ==========================================================
  // REFRESH LOCATION
  // ==========================================================
  const refreshLocation = async () => {
    try {
      setMessage("");

      await getStudentLocation();
    } catch (error) {
      console.error(
        "Location refresh error:",
        error
      );
    }
  };

  // ==========================================================
  // CALCULATE DISTANCE
  // ==========================================================
  const calculateDistance = (
    studentLatitude,
    studentLongitude,
    lecturerLatitude,
    lecturerLongitude
  ) => {
    const earthRadius = 6371000;

    const lat1 =
      (studentLatitude * Math.PI) / 180;

    const lat2 =
      (lecturerLatitude * Math.PI) / 180;

    const deltaLatitude =
      ((lecturerLatitude - studentLatitude) *
        Math.PI) /
      180;

    const deltaLongitude =
      ((lecturerLongitude - studentLongitude) *
        Math.PI) /
      180;

    const a =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLongitude / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadius * c;
  };

  // ==========================================================
  // GET ATTENDANCE SESSION
  // ==========================================================
  const getAttendanceSession = async (
    qrToken
  ) => {
    const token =
      localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/attendance-sessions/token/${qrToken}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to find attendance session."
      );
    }

    // ========================================================
    // FIX:
    // The backend returns:
    //
    // {
    //   session: {
    //     lecturerLatitude: ...,
    //     lecturerLongitude: ...
    //   }
    // }
    //
    // So return the actual session object.
    // ========================================================
    return data.session || data;
  };

  // ==========================================================
  // RECORD ATTENDANCE
  // ==========================================================
  const recordAttendance = async (
    qrToken,
    studentLocation,
    calculatedDistance
  ) => {
    const token =
      localStorage.getItem("token");

    const scanDeviceId =
      getCurrentDeviceId();

    if (
      !scanDeviceId ||
      typeof scanDeviceId !== "string" ||
      scanDeviceId.trim() === ""
    ) {
      throw new Error(
        "Scanning device could not be identified. Please refresh the page and try again."
      );
    }

    if (!user?.id) {
      throw new Error(
        "Student information could not be found. Please log in again."
      );
    }

    const response = await fetch(
      `${API_URL}/api/attendance/scan`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          qrToken,

          studentId: user.id,

          latitude:
            studentLocation.latitude,

          longitude:
            studentLocation.longitude,

          accuracy:
            studentLocation.accuracy,

          distanceFromLecturer:
            calculatedDistance,

          scanDeviceId:
            scanDeviceId.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to record attendance."
      );
    }

    return data;
  };

  // ==========================================================
  // STOP SCANNER
  // ==========================================================
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const scanner =
          scannerRef.current;

        scannerRef.current = null;

        try {
          const state =
            scanner.getState();

          if (state === 2) {
            await scanner.stop();
          }
        } catch (error) {
          console.log(
            "Scanner stop:",
            error
          );
        }

        try {
          scanner.clear();
        } catch (error) {
          console.log(
            "Scanner clear:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Scanner stop error:",
        error
      );
    }

    setScanning(false);
  };

  // ==========================================================
  // HANDLE QR SCAN
  // ==========================================================
  const handleScan = async (
    decodedText
  ) => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      setMessage("");
      setLoading(true);

      // Make sure device exists
      const deviceId =
        getCurrentDeviceId();

      if (
        !deviceId ||
        typeof deviceId !== "string" ||
        deviceId.trim() === ""
      ) {
        throw new Error(
          "Scanning device could not be identified. Please refresh the page and try again."
        );
      }

      // Stop scanner
      await stopScanner();

      // Check location permission
      const permissionState =
        await checkLocationPermission();

      if (
        permissionState === "denied"
      ) {
        throw new Error(
          "Location permission is blocked. Please enable location access in your browser settings."
        );
      }

      // ======================================================
      // GET STUDENT LOCATION
      // ======================================================
      let studentLocation = location;

      if (
        !studentLocation ||
        typeof studentLocation.latitude !==
          "number" ||
        typeof studentLocation.longitude !==
          "number"
      ) {
        studentLocation =
          await getStudentLocation();
      }

      // ======================================================
      // GET ATTENDANCE SESSION
      // ======================================================
      const session =
        await getAttendanceSession(
          decodedText
        );

      console.log(
        "Attendance session received:",
        session
      );

      // ======================================================
      // GET LECTURER LOCATION
      // ======================================================
      const lecturerLatitude =
        Number(
          session.lecturerLatitude
        );

      const lecturerLongitude =
        Number(
          session.lecturerLongitude
        );

      // ======================================================
      // VALIDATE LECTURER LOCATION
      // ======================================================
      if (
        !Number.isFinite(
          lecturerLatitude
        ) ||
        !Number.isFinite(
          lecturerLongitude
        )
      ) {
        throw new Error(
          "Lecturer location is not available for this attendance session."
        );
      }

      // ======================================================
      // CALCULATE DISTANCE
      // ======================================================
      const calculatedDistance =
        calculateDistance(
          studentLocation.latitude,
          studentLocation.longitude,
          lecturerLatitude,
          lecturerLongitude
        );

      console.log(
        "Student latitude:",
        studentLocation.latitude
      );

      console.log(
        "Student longitude:",
        studentLocation.longitude
      );

      console.log(
        "Lecturer latitude:",
        lecturerLatitude
      );

      console.log(
        "Lecturer longitude:",
        lecturerLongitude
      );

      console.log(
        "Distance from lecturer:",
        calculatedDistance,
        "meters"
      );

      // ======================================================
      // CHECK ALLOWED RADIUS
      // ======================================================
      if (
        calculatedDistance >
        ALLOWED_RADIUS
      ) {
        throw new Error(
          "You are outside the allowed attendance area."
        );
      }

      // ======================================================
      // RECORD ATTENDANCE
      // ======================================================
      const result =
        await recordAttendance(
          decodedText,
          studentLocation,
          calculatedDistance
        );

      setMessage(
        result.message ||
          "Attendance recorded successfully."
      );
    } catch (error) {
      console.error(
        "Attendance scan error:",
        error
      );

      setMessage(
        error.message ||
          "Something went wrong while recording attendance."
      );
    } finally {
      setLoading(false);

      processingRef.current =
        false;
    }
  };

  // ==========================================================
  // START SCANNER
  // ==========================================================
  const startScanner = async () => {
    try {
      setMessage("");

      processingRef.current =
        false;

      // Make sure device exists
      const deviceId =
        getCurrentDeviceId();

      if (
        !deviceId ||
        typeof deviceId !== "string" ||
        deviceId.trim() === ""
      ) {
        throw new Error(
          "Scanning device could not be identified."
        );
      }

      // ======================================================
      // MAKE SURE LOCATION IS AVAILABLE
      // ======================================================
      if (!location) {
        try {
          await getStudentLocation();
        } catch (error) {
          throw new Error(
            "Your location could not be detected. Please allow location access and try again."
          );
        }
      }

      // ======================================================
      // MAKE SURE OLD SCANNER IS GONE
      // ======================================================
      if (scannerRef.current) {
        await stopScanner();
      }

      // ======================================================
      // CREATE SCANNER
      // ======================================================
      const scanner =
        new Html5Qrcode(
          "qr-reader"
        );

      scannerRef.current =
        scanner;

      // ======================================================
      // START CAMERA
      // ======================================================
      await scanner.start(
        {
          facingMode:
            "environment",
        },

        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250,
          },
        },

        (decodedText) => {
          handleScan(decodedText);
        },

        () => {
          // Ignore normal scanner errors
        }
      );

      setScanning(true);
    } catch (error) {
      console.error(
        "Scanner start error:",
        error
      );

      scannerRef.current =
        null;

      setScanning(false);

      setMessage(
        error.message ||
          "Unable to start the camera. Please allow camera access and try again."
      );
    }
  };

  // ==========================================================
  // CLEANUP
  // ==========================================================
  useEffect(() => {
    return () => {
      const scanner =
        scannerRef.current;

      if (scanner) {
        scannerRef.current =
          null;

        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear();
            } catch (error) {
              // Ignore cleanup errors
            }
          });
      }
    };
  }, []);

  // ==========================================================
  // UI
  // ==========================================================
  return (
    <div className="scan-qr-page">
      <div className="scan-qr-container">

        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="scan-qr-header">
          <div className="scan-qr-icon">
            <FaQrcode />
          </div>

          <div>
            <h1>
              Scan Attendance QR
            </h1>

            <p>
              Scan the lecturer's QR code
              to mark your attendance.
            </p>
          </div>
        </div>

        {/* ==================================================
            MAIN CARD
        ================================================== */}
        <div className="scan-qr-card">

          {/* ==================================================
              LOCATION SECTION
          ================================================== */}
          <div className="student-location-card">

            <div className="student-location-header">

              <div className="student-location-icon">
                <FaMapMarkerAlt />
              </div>

              <div>
                <h3>
                  Your Current Location
                </h3>

                <p>
                  Your location is used to verify
                  attendance.
                </p>
              </div>

              <button
                type="button"
                className="refresh-location-button"
                onClick={
                  refreshLocation
                }
                disabled={
                  gettingLocation ||
                  loading
                }
                title="Refresh location"
              >
                <FaSyncAlt
                  className={
                    gettingLocation
                      ? "spinning"
                      : ""
                  }
                />
              </button>
            </div>

            {/* ==================================================
                LOCATION LOADING
            ================================================== */}
            {gettingLocation && (
              <div className="location-loading">

                <FaLocationArrow />

                <span>
                  Detecting your current
                  location...
                </span>

              </div>
            )}

            {/* ==================================================
                LOCATION SUCCESS
            ================================================== */}
            {!gettingLocation &&
              location && (
                <div className="location-detected">

                  <div className="location-status-title">

                    <FaCheckCircle />

                    <span>
                      Location detected
                      successfully
                    </span>

                  </div>

                  <div className="location-details">

                    <div className="location-detail">
                      <span>
                        Latitude
                      </span>

                      <strong>
                        {location.latitude.toFixed(
                          6
                        )}
                      </strong>
                    </div>

                    <div className="location-detail">
                      <span>
                        Longitude
                      </span>

                      <strong>
                        {location.longitude.toFixed(
                          6
                        )}
                      </strong>
                    </div>

                    <div className="location-detail">
                      <span>
                        Accuracy
                      </span>

                      <strong>
                        {Math.round(
                          location.accuracy
                        )}{" "}
                        m
                      </strong>
                    </div>

                  </div>

                </div>
              )}

            {/* ==================================================
                LOCATION ERROR
            ================================================== */}
            {!gettingLocation &&
              !location &&
              locationError && (
                <div className="location-error">

                  <FaExclamationTriangle />

                  <div>

                    <strong>
                      Location not detected
                    </strong>

                    <p>
                      {locationError}
                    </p>

                    <button
                      type="button"
                      onClick={
                        refreshLocation
                      }
                      disabled={
                        gettingLocation
                      }
                    >
                      Try Again
                    </button>

                  </div>

                </div>
              )}

          </div>

          {/* ==================================================
              SCANNER
          ================================================== */}
          <div className="scanner-section">

            <div className="scanner-section-title">

              <h3>
                QR Code Scanner
              </h3>

              <p>
                Position the lecturer's QR code
                inside the scanning area.
              </p>

            </div>

            <div className="scanner-wrapper">

              <div
                id="qr-reader"
                className="qr-reader"
              ></div>

            </div>

          </div>

          {/* ==================================================
              CONTROLS
          ================================================== */}
          <div className="scanner-controls">

            {!scanning ? (
              <button
                type="button"
                className="scan-button"
                onClick={
                  startScanner
                }
                disabled={
                  loading ||
                  gettingLocation ||
                  !location
                }
              >
                <FaQrcode />

                {loading
                  ? "Processing..."
                  : gettingLocation
                  ? "Detecting Location..."
                  : !location
                  ? "Location Required"
                  : "Start QR Scanner"}
              </button>
            ) : (
              <button
                type="button"
                className="stop-scan-button"
                onClick={
                  stopScanner
                }
                disabled={
                  loading
                }
              >
                Stop Scanner
              </button>
            )}

          </div>

          {/* ==================================================
              VERIFYING STATUS
          ================================================== */}
          {loading && (
            <div className="scan-status loading-status">

              <FaLocationArrow />

              <span>
                Verifying your
                attendance...
              </span>

            </div>
          )}

          {/* ==================================================
              MESSAGE
          ================================================== */}
          {message && (
            <div
              className={`scan-message ${
                message
                  .toLowerCase()
                  .includes("success")
                  ? "success"
                  : "error"
              }`}
            >

              {message
                .toLowerCase()
                .includes("success") && (
                <FaCheckCircle />
              )}

              <span>
                {message}
              </span>

            </div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}
          {message
            .toLowerCase()
            .includes("success") && (
            <div className="attendance-success">

              <FaCheckCircle />

              <div>

                <strong>
                  Attendance Marked
                </strong>

                <p>
                  Your attendance has been
                  successfully recorded for this
                  session.
                </p>

              </div>

            </div>
          )}

          {/* ==================================================
              INSTRUCTIONS
          ================================================== */}
          <div className="scan-instructions">

            <h3>
              How to mark attendance
            </h3>

            <div className="instruction-item">

              <span>
                1
              </span>

              <p>
                Allow location access so the
                system can verify your attendance.
              </p>

            </div>

            <div className="instruction-item">

              <span>
                2
              </span>

              <p>
                Click "Start QR Scanner" and allow
                camera access.
              </p>

            </div>

            <div className="instruction-item">

              <span>
                3
              </span>

              <p>
                Point your camera at the lecturer's
                attendance QR code.
              </p>

            </div>

            <div className="instruction-item">

              <span>
                4
              </span>

              <p>
                Wait for the system to confirm your
                attendance.
              </p>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default ScanQR;