import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FaQrcode, FaLocationArrow, FaCheckCircle } from "react-icons/fa";
import API_URL from "../../config/api";

const ALLOWED_RADIUS = 3000000;

// Persistent browser/device identifier.
// The same browser keeps the same ID across student logins.
const DEVICE_STORAGE_KEY = "attendanceDeviceId";

function ScanQR() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // ----------------------------------------------------------
  // Get or create persistent device ID
  // ----------------------------------------------------------
  const getDeviceId = () => {
    let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);

    if (!deviceId) {
      if (window.crypto?.randomUUID) {
        deviceId = window.crypto.randomUUID();
      } else {
        deviceId =
          "device-" +
          Date.now() +
          "-" +
          Math.random().toString(36).substring(2, 15);
      }

      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    }

    return deviceId;
  };

  // Create the device ID when the page loads.
  useEffect(() => {
    getDeviceId();
  }, []);

  // ----------------------------------------------------------
  // Check location permission
  // ----------------------------------------------------------
  const checkLocationPermission = async () => {
    try {
      if (!navigator.permissions) {
        return "prompt";
      }

      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      return permission.state;
    } catch (error) {
      return "prompt";
    }
  };

  // ----------------------------------------------------------
  // Get student's current location
  // ----------------------------------------------------------
  const getStudentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this device."));
        return;
      }

      setGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGettingLocation(false);

          const studentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setLocation(studentLocation);

          resolve(studentLocation);
        },
        (error) => {
          setGettingLocation(false);

          let errorMessage = "Unable to get your location.";

          if (error.code === error.PERMISSION_DENIED) {
            errorMessage =
              "Location permission is required to mark attendance.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage =
              "Your current location could not be determined.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage =
              "Getting your location took too long. Please try again.";
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  // ----------------------------------------------------------
  // Calculate distance using Haversine formula
  // ----------------------------------------------------------
  const calculateDistance = (
    studentLatitude,
    studentLongitude,
    lecturerLatitude,
    lecturerLongitude
  ) => {
    const earthRadius = 6371000;

    const lat1 = (studentLatitude * Math.PI) / 180;
    const lat2 = (lecturerLatitude * Math.PI) / 180;

    const deltaLatitude =
      ((lecturerLatitude - studentLatitude) * Math.PI) / 180;

    const deltaLongitude =
      ((lecturerLongitude - studentLongitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLongitude / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  };

  // ----------------------------------------------------------
  // Get attendance session using QR token
  // ----------------------------------------------------------
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
      throw new Error(data.message || "Unable to find attendance session.");
    }

    return data;
  };

  // ----------------------------------------------------------
  // Record attendance
  // ----------------------------------------------------------
  const recordAttendance = async (
    qrToken,
    studentLocation,
    calculatedDistance
  ) => {
    const token = localStorage.getItem("token");

    // Make sure the browser has a persistent device ID.
    const scanDeviceId = getDeviceId();

    const response = await fetch(`${API_URL}/api/attendance/scan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qrToken,
        studentId: user?.id,

        latitude: studentLocation.latitude,
        longitude: studentLocation.longitude,
        accuracy: studentLocation.accuracy,

        distanceFromLecturer: calculatedDistance,

        // Device identifier used by the backend to prevent
        // another student from scanning on the same browser/device
        // during the same attendance session.
        scanDeviceId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to record attendance.");
    }

    return data;
  };

  // ----------------------------------------------------------
  // Stop QR scanner
  // ----------------------------------------------------------
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const scannerState = scannerRef.current.getState();

        if (scannerState === 2) {
          await scannerRef.current.stop();
        }

        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error("Scanner stop error:", error);
    }

    setScanning(false);
  };

  // ----------------------------------------------------------
  // Handle QR scan
  // ----------------------------------------------------------
  const handleScan = async (decodedText) => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      setMessage("");
      setLoading(true);

      // Stop camera immediately after a QR code is detected.
      await stopScanner();

      // ------------------------------------------------------
      // Check location permission
      // ------------------------------------------------------
      const permissionState = await checkLocationPermission();

      if (permissionState === "denied") {
        throw new Error(
          "Location permission is blocked. Please enable location access in your browser settings."
        );
      }

      // ------------------------------------------------------
      // Get student location
      // ------------------------------------------------------
      const studentLocation = await getStudentLocation();

      // ------------------------------------------------------
      // Get attendance session
      // ------------------------------------------------------
      const session = await getAttendanceSession(decodedText);

      const lecturerLatitude = Number(session.lecturerLatitude);
      const lecturerLongitude = Number(session.lecturerLongitude);

      if (
        Number.isNaN(lecturerLatitude) ||
        Number.isNaN(lecturerLongitude)
      ) {
        throw new Error(
          "Lecturer location is not available for this attendance session."
        );
      }

      // ------------------------------------------------------
      // Calculate distance
      // ------------------------------------------------------
      const calculatedDistance = calculateDistance(
        studentLocation.latitude,
        studentLocation.longitude,
        lecturerLatitude,
        lecturerLongitude
      );

      setDistance(calculatedDistance);

      // ------------------------------------------------------
      // Check allowed radius
      // ------------------------------------------------------
      if (calculatedDistance > ALLOWED_RADIUS) {
        throw new Error(
          "You are outside the allowed attendance area."
        );
      }

      // ------------------------------------------------------
      // Record attendance
      // ------------------------------------------------------
      const result = await recordAttendance(
        decodedText,
        studentLocation,
        calculatedDistance
      );

      setMessage(
        result.message || "Attendance recorded successfully."
      );
    } catch (error) {
      console.error("Attendance scan error:", error);

      setMessage(
        error.message || "Something went wrong while recording attendance."
      );
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // ----------------------------------------------------------
  // Start QR scanner
  // ----------------------------------------------------------
  const startScanner = async () => {
    try {
      setMessage("");
      setLocation(null);
      setDistance(null);
      processingRef.current = false;

      // Make sure the device ID exists before scanning.
      getDeviceId();

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
          // Ignore normal QR scanning errors.
        }
      );

      setScanning(true);
    } catch (error) {
      console.error("Scanner start error:", error);

      scannerRef.current = null;
      setScanning(false);

      setMessage(
        "Unable to start the camera. Please allow camera access and try again."
      );
    }
  };

  // ----------------------------------------------------------
  // Cleanup scanner when leaving page
  // ----------------------------------------------------------
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
    <div className="scan-qr-page">
      <div className="scan-qr-container">

        {/* Header */}
        <div className="scan-qr-header">
          <div className="scan-qr-icon">
            <FaQrcode />
          </div>

          <div>
            <h1>Scan Attendance QR</h1>
            <p>
              Scan the lecturer's QR code to mark your attendance.
            </p>
          </div>
        </div>

        {/* Scanner Card */}
        <div className="scan-qr-card">

          <div className="scanner-wrapper">
            <div
              id="qr-reader"
              className="qr-reader"
            ></div>
          </div>

          {/* Controls */}
          <div className="scanner-controls">
            {!scanning ? (
              <button
                type="button"
                className="scan-button"
                onClick={startScanner}
                disabled={loading || gettingLocation}
              >
                <FaQrcode />

                {loading
                  ? "Processing..."
                  : gettingLocation
                  ? "Getting Location..."
                  : "Start QR Scanner"}
              </button>
            ) : (
              <button
                type="button"
                className="stop-scan-button"
                onClick={stopScanner}
                disabled={loading}
              >
                Stop Scanner
              </button>
            )}
          </div>

          {/* Status */}
          {loading && (
            <div className="scan-status loading-status">
              <FaLocationArrow />
              <span>
                Verifying your attendance...
              </span>
            </div>
          )}

          {gettingLocation && (
            <div className="scan-status location-status">
              <FaLocationArrow />
              <span>
                Getting your current location...
              </span>
            </div>
          )}

          {message && (
            <div
              className={`scan-message ${
                message.toLowerCase().includes("success")
                  ? "success-message"
                  : "error-message"
              }`}
            >
              {message.toLowerCase().includes("success") && (
                <FaCheckCircle />
              )}

              <span>{message}</span>
            </div>
          )}

          {/* Success information */}
          {message &&
            message.toLowerCase().includes("success") && (
              <div className="attendance-success">
                <FaCheckCircle />

                <div>
                  <strong>Attendance Marked</strong>
                  <p>
                    Your attendance has been successfully recorded
                    for this session.
                  </p>
                </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}

export default ScanQR;