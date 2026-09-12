import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  FaQrcode,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";

import "../../styles/scanQR.css";

const ALLOWED_RADIUS = 3000000; // meters

function ScanQR() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [studentLocation, setStudentLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ---------------------------------------------------------
  // Check browser location permission
  // ---------------------------------------------------------
  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      return {
        allowed: false,
        message: "Geolocation is not supported by this browser.",
      };
    }

    // Some browsers may not support the Permissions API.
    if (!navigator.permissions?.query) {
      return {
        allowed: true,
        permission: "unknown",
      };
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        return {
          allowed: false,
          permission: "denied",
          message:
            "Location permission is blocked for this website. Please allow location access in your browser settings and try again.",
        };
      }

      if (permission.state === "granted") {
        return {
          allowed: true,
          permission: "granted",
        };
      }

      // "prompt"
      return {
        allowed: true,
        permission: "prompt",
      };
    } catch (error) {
      console.warn(
        "Unable to check location permission:",
        error
      );

      // If permission checking is unavailable,
      // let getCurrentPosition() request it normally.
      return {
        allowed: true,
        permission: "unknown",
      };
    }
  };

  // ---------------------------------------------------------
  // Calculate distance between two GPS coordinates
  // ---------------------------------------------------------
  const calculateDistance = (
    studentLatitude,
    studentLongitude,
    lecturerLatitude,
    lecturerLongitude
  ) => {
    const earthRadius = 6371000;

    const lat1 = (studentLatitude * Math.PI) / 180;
    const lat2 = (lecturerLatitude * Math.PI) / 180;

    const deltaLat =
      ((lecturerLatitude - studentLatitude) * Math.PI) / 180;

    const deltaLon =
      ((lecturerLongitude - studentLongitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c =
      2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  };

  // ---------------------------------------------------------
  // Get student's current GPS location
  // ---------------------------------------------------------
  const getStudentLocation = async () => {
    if (!navigator.geolocation) {
      throw new Error(
        "Geolocation is not supported by this browser."
      );
    }

    // Check permission before requesting GPS.
    const permission = await checkLocationPermission();

    if (!permission.allowed) {
      throw new Error(
        permission.message ||
          "Location permission is not available."
      );
    }

    setGettingLocation(true);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGettingLocation(false);

          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          // Validate coordinates.
          if (
            !Number.isFinite(location.latitude) ||
            !Number.isFinite(location.longitude)
          ) {
            reject(
              new Error(
                "Your browser returned an invalid location. Please try again."
              )
            );
            return;
          }

          setStudentLocation(location);

          resolve(location);
        },

        (error) => {
          setGettingLocation(false);

          let errorMessage =
            "Unable to get your current location.";

          if (error.code === error.PERMISSION_DENIED) {
            errorMessage =
              "Location permission was denied. Please allow location access for this website and try again.";
          } else if (
            error.code === error.POSITION_UNAVAILABLE
          ) {
            errorMessage =
              "Your current location could not be determined. Please make sure your device location/GPS is turned on and try again.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage =
              "Getting your location took too long. Please make sure GPS/location services are enabled and try again.";
          }

          reject(new Error(errorMessage));
        },

        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    });
  };

  // ---------------------------------------------------------
  // Get attendance session using QR token
  // ---------------------------------------------------------
  const getAttendanceSession = async (qrToken) => {
    const token = localStorage.getItem("token");

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
          "Unable to retrieve attendance session."
      );
    }

    return data.session;
  };

  // ---------------------------------------------------------
  // Record attendance
  // ---------------------------------------------------------
  const recordAttendance = async (
    qrToken,
    location,
    calculatedDistance
  ) => {
    const token = localStorage.getItem("token");

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
          studentId: user?.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          distanceFromLecturer: calculatedDistance,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to record attendance."
      );
    }

    return data;
  };

  // ---------------------------------------------------------
  // Handle successful QR scan
  // ---------------------------------------------------------
  const handleScan = async (decodedText) => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    setLoading(true);

    try {
      // Stop camera immediately after successful scan.
      await stopScanner();

      setMessage("Checking location permission...");
      setMessageType("info");

      // -----------------------------------------------------
      // 1. Check location permission
      // -----------------------------------------------------
      const permission = await checkLocationPermission();

      if (!permission.allowed) {
        throw new Error(
          permission.message ||
            "Location permission is required to mark attendance."
        );
      }

      // -----------------------------------------------------
      // 2. Get student's GPS
      // -----------------------------------------------------
      setMessage("Getting your current location...");
      setMessageType("info");

      const location = await getStudentLocation();

      // -----------------------------------------------------
      // 3. Get attendance session
      // -----------------------------------------------------
      setMessage("Checking attendance session...");
      setMessageType("info");

      const session = await getAttendanceSession(
        decodedText
      );

      if (!session) {
        throw new Error(
          "Attendance session could not be found."
        );
      }

      // -----------------------------------------------------
      // 4. Get lecturer GPS
      // -----------------------------------------------------
      const lecturerLatitude = Number(
        session.lecturerLatitude
      );

      const lecturerLongitude = Number(
        session.lecturerLongitude
      );

      if (
        !Number.isFinite(lecturerLatitude) ||
        !Number.isFinite(lecturerLongitude)
      ) {
        throw new Error(
          "This attendance session does not have valid lecturer location data."
        );
      }

      // -----------------------------------------------------
      // 5. Calculate distance
      // -----------------------------------------------------
      setMessage(
        "Checking your distance from the lecturer..."
      );
      setMessageType("info");

      const calculatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        lecturerLatitude,
        lecturerLongitude
      );

      // Keep distance internally for attendance verification.
      setDistance(calculatedDistance);

      // -----------------------------------------------------
      // 6. Check allowed attendance area
      // -----------------------------------------------------
      if (calculatedDistance > ALLOWED_RADIUS) {
        setMessage(
          "Attendance could not be recorded because your current location is outside the attendance area."
        );

        setMessageType("error");
        return;
      }

      // -----------------------------------------------------
      // 7. Record attendance
      // -----------------------------------------------------
      setMessage(
        "Location verified. Recording attendance..."
      );
      setMessageType("info");

      await recordAttendance(
        decodedText,
        location,
        calculatedDistance
      );

      setMessage("Attendance recorded successfully!👌👌👌");
      setMessageType("success");
    } catch (error) {
      console.error("QR attendance error:", error);

      setMessage(
        error.message ||
          "Something went wrong while scanning the QR code."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // ---------------------------------------------------------
  // Start QR scanner
  // ---------------------------------------------------------
  const startScanner = async () => {
    if (scanning || loading) {
      return;
    }

    setMessage("");
    setMessageType("");
    setDistance(null);

    try {
      // Check camera support.
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
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
          // Ignore normal QR scanning failures.
        }
      );

      setScanning(true);
    } catch (error) {
      console.error(
        "Unable to start QR scanner:",
        error
      );

      setMessage(
        "Unable to access the camera. Please allow camera permission and try again."
      );

      setMessageType("error");

      scannerRef.current = null;
    }
  };

  // ---------------------------------------------------------
  // Stop QR scanner
  // ---------------------------------------------------------
  const stopScanner = async () => {
    if (!scannerRef.current) {
      setScanning(false);
      return;
    }

    try {
      const scanner = scannerRef.current;

      if (scanner.isScanning) {
        await scanner.stop();
      }

      scanner.clear();
    } catch (error) {
      console.error(
        "Error stopping scanner:",
        error
      );
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  };

  // ---------------------------------------------------------
  // Cleanup scanner when leaving page
  // ---------------------------------------------------------
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scannerRef.current?.clear();
            } catch (error) {
              // Ignore cleanup errors
            }

            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <DashboardLayout
      title="Scan QR Code"
      role="student"
    >
      <PageHeader
        title="Scan Attendance QR"
        subtitle="Scan your lecturer's QR code to mark your attendance."
      />

      <div className="scan-qr-page">
        <div className="scan-card">

          {/* Scanner Header */}
          <div className="scan-card-header">
            <div className="scan-icon">
              <FaQrcode />
            </div>

            <div>
              <h2>Attendance Scanner</h2>

              <p>
                Scan the QR code displayed by your lecturer.
              </p>
            </div>
          </div>

          {/* QR Reader */}
          <div
            id="qr-reader"
            className="qr-reader"
          ></div>

          {/* Status Message */}
          {message && (
            <div
              className={`scan-message ${messageType}`}
            >
              {messageType === "success" && (
                <FaCheckCircle />
              )}

              {messageType === "error" && (
                <FaTimesCircle />
              )}

              {messageType === "info" && (
                <FaSpinner className="spin" />
              )}

              <span>{message}</span>
            </div>
          )}

          {/* GPS Information */}
          {studentLocation && (
            <div className="location-info">
              <div className="location-title">
                <FaMapMarkerAlt />
                <span>Your Current Location</span>
              </div>

              <div className="location-details">
                <div>
                  <strong>Latitude</strong>

                  <span>
                    {studentLocation.latitude.toFixed(6)}
                  </span>
                </div>

                <div>
                  <strong>Longitude</strong>

                  <span>
                    {studentLocation.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Controls */}
          <div className="scanner-controls">
            {!scanning ? (
              <button
                type="button"
                className="scan-btn"
                onClick={startScanner}
                disabled={
                  loading || gettingLocation
                }
              >
                <FaQrcode />
                Start Scanner
              </button>
            ) : (
              <button
                type="button"
                className="stop-scan-btn"
                onClick={stopScanner}
                disabled={loading}
              >
                <FaTimesCircle />
                Stop Scanner
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="scan-instructions">
            <h3>How it works</h3>

            <div className="instruction-item">
              <span>1</span>

              <p>
                Click{" "}
                <strong>Start Scanner</strong>.
              </p>
            </div>

            <div className="instruction-item">
              <span>2</span>

              <p>
                Allow camera and location
                permissions.
              </p>
            </div>

            <div className="instruction-item">
              <span>3</span>

              <p>
                Scan the QR code displayed by
                your lecturer.
              </p>
            </div>

            <div className="instruction-item">
              <span>4</span>

              <p>
                Your location is checked against
                the lecturer's current location.
              </p>
            </div>

            <div className="instruction-item">
              <span>5</span>

              <p>
                Attendance is accepted when you
                are close enough to the lecturer.
              </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default ScanQR;