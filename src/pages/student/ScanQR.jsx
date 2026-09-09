import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";

function ScanQR() {
    const [scanning, setScanning] = useState(true);
    const [message, setMessage] = useState("");
    const [checkingLocation, setCheckingLocation] = useState(false);
    const [useTestLocation, setUseTestLocation] = useState(true);

    const student = JSON.parse(localStorage.getItem("user"));

    /*
     * ==========================================
     * ATTENDANCE LOCATION
     * ==========================================
     *
     * TEMPORARY TEST LOCATION
     *
     * Replace these coordinates later with the
     * actual classroom/campus coordinates.
     */

    const CLASS_LOCATION = {
        latitude: 5.6037,
        longitude: -0.1870,
    };

    /*
     * Students must be within this distance
     * from the classroom.
     */
    const ALLOWED_RADIUS = 100; // metres


    /*
     * ==========================================
     * CALCULATE DISTANCE
     * ==========================================
     *
     * Uses the Haversine formula to calculate
     * distance between two GPS coordinates.
     */

    function calculateDistance(
        latitude1,
        longitude1,
        latitude2,
        longitude2
    ) {
        const earthRadius = 6371000;

        const lat1 = (latitude1 * Math.PI) / 180;
        const lat2 = (latitude2 * Math.PI) / 180;

        const deltaLat =
            ((latitude2 - latitude1) * Math.PI) / 180;

        const deltaLon =
            ((longitude2 - longitude1) * Math.PI) / 180;

        const a =
            Math.sin(deltaLat / 2) *
                Math.sin(deltaLat / 2) +
            Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(deltaLon / 2) *
                Math.sin(deltaLon / 2);

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return earthRadius * c;
    }


    /*
     * ==========================================
     * GET STUDENT LOCATION
     * ==========================================
     */

    function getStudentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(
                    new Error(
                        "GPS is not supported by this device."
                    )
                );
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude:
                            position.coords.latitude,
                        longitude:
                            position.coords.longitude,
                        accuracy:
                            position.coords.accuracy,
                    });
                },
                (error) => {
                    let errorMessage =
                        "Unable to get your location.";

                    if (error.code === 1) {
                        errorMessage =
                            "Location permission was denied. Please allow GPS access.";
                    }

                    if (error.code === 2) {
                        errorMessage =
                            "Your location could not be determined.";
                    }

                    if (error.code === 3) {
                        errorMessage =
                            "Location request timed out. Please try again.";
                    }

                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    }


    /*
     * ==========================================
     * CHECK GPS LOCATION
     * ==========================================
     */

    async function checkLocation() {
        setCheckingLocation(true);
        setMessage("");

        try {
            let studentLocation;

            /*
             * ======================================
             * TEMPORARY TEST MODE
             * ======================================
             *
             * This allows you to test the system
             * while you are at home.
             */

            if (useTestLocation) {

                studentLocation = {
                    latitude: CLASS_LOCATION.latitude,
                    longitude: CLASS_LOCATION.longitude,
                    accuracy: 5,
                };

                console.log(
                    "GPS TEST MODE ENABLED"
                );

            } else {

                studentLocation =
                    await getStudentLocation();

                console.log(
                    "Real student location:",
                    studentLocation
                );
            }


            /*
             * Calculate distance from classroom.
             */

            const distance =
                calculateDistance(
                    studentLocation.latitude,
                    studentLocation.longitude,
                    CLASS_LOCATION.latitude,
                    CLASS_LOCATION.longitude
                );


            console.log(
                "Distance from classroom:",
                distance,
                "metres"
            );


            /*
             * Check whether student is
             * inside allowed radius.
             */

            if (distance > ALLOWED_RADIUS) {

                setCheckingLocation(false);

                setScanning(true);

                setMessage(
                    `Attendance denied. You are approximately ${Math.round(
                        distance
                    )} metres away from the attendance location. You must be within ${ALLOWED_RADIUS} metres.`
                );

                return false;
            }


            /*
             * Student is inside the location.
             */

            console.log(
                "Location verified successfully."
            );

            setCheckingLocation(false);

            return true;

        } catch (error) {

            console.error(
                "GPS error:",
                error
            );

            setCheckingLocation(false);
            setScanning(true);

            setMessage(
                error.message ||
                    "Unable to verify your location."
            );

            return false;
        }
    }


    /*
     * ==========================================
     * QR SCAN
     * ==========================================
     */

    async function handleScan(result) {

        if (
            !result ||
            !scanning ||
            checkingLocation
        ) {
            return;
        }

        /*
         * Stop scanner while processing.
         */

        setScanning(false);

        setMessage(
            "Checking your location..."
        );


        /*
         * Verify GPS first.
         */

        const locationAllowed =
            await checkLocation();

        if (!locationAllowed) {
            return;
        }


        /*
         * Get QR token.
         */

        const qrToken =
            result?.[0]?.rawValue;

        if (!qrToken) {

            setMessage(
                "Invalid QR code. Please scan again."
            );

            setScanning(true);

            return;
        }


        /*
         * ======================================
         * SEND ATTENDANCE TO BACKEND
         * ======================================
         */

        try {

            setMessage(
                "Location verified. Recording attendance..."
            );

            const response =
                await fetch(
                    `${API_URL}/api/attendance/scan`,
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
                            qrToken,
                            studentId:
                                student.id,
                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                setMessage(
                    data.message ||
                        "Unable to record attendance."
                );

                setScanning(true);

                return;
            }


            /*
             * Successful attendance.
             */

            setMessage(
                data.message ||
                    "Attendance recorded successfully."
            );

        } catch (error) {

            console.error(
                "Attendance error:",
                error
            );

            setMessage(
                "Server Error. Please try again."
            );

            setScanning(true);
        }
    }


    /*
     * ==========================================
     * RETRY
     * ==========================================
     */

    function handleRetry() {
        setMessage("");
        setScanning(true);
    }


    return (
        <DashboardLayout
            title="Scan QR"
            role="student"
        >

            <PageHeader
                title="Scan Attendance"
                subtitle="Scan the lecturer's QR code and verify your location."
            />


            <div className="scan-page">


                {/* GPS MODE */}

                <div
                    style={{
                        marginBottom: "20px",
                        padding: "15px",
                        borderRadius: "10px",
                        background: "#f5f5f5",
                    }}
                >

                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "pointer",
                        }}
                    >

                        <input
                            type="checkbox"
                            checked={useTestLocation}
                            onChange={(e) =>
                                setUseTestLocation(
                                    e.target.checked
                                )
                            }
                        />

                        <span>
                            🧪 Use test location
                        </span>

                    </label>


                    {useTestLocation && (
                        <small
                            style={{
                                display: "block",
                                marginTop: "8px",
                                color: "#777",
                            }}
                        >
                            Test mode is enabled.
                            The system will simulate
                            that you are at the
                            classroom location.
                        </small>
                    )}

                </div>


                {/* LOCATION CHECKING */}

                {checkingLocation && (

                    <div
                        style={{
                            textAlign: "center",
                            padding: "20px",
                        }}
                    >

                        <h3>
                            📍 Checking your location...
                        </h3>

                        <p>
                            Please wait while we
                            verify that you are
                            within the attendance
                            area.
                        </p>

                    </div>

                )}


                {/* QR SCANNER */}

                {scanning &&
                    !checkingLocation && (

                        <div
                            style={{
                                maxWidth: "500px",
                                margin: "auto",
                            }}
                        >

                            <Scanner
                                constraints={{
                                    facingMode: {
                                        ideal:
                                            "environment",
                                    },
                                }}
                                scanDelay={500}
                                onScan={handleScan}
                                onError={(error) => {
                                    console.log(
                                        error
                                    );
                                }}
                            />

                        </div>

                    )}


                {/* MESSAGE */}

                {message && (

                    <div
                        className="scan-message"
                        style={{
                            marginTop: "20px",
                            padding: "20px",
                            textAlign: "center",
                        }}
                    >

                        <h2>
                            {message}
                        </h2>


                        {!checkingLocation &&
                            scanning && (

                                <button
                                    type="button"
                                    onClick={
                                        handleRetry
                                    }
                                    style={{
                                        marginTop:
                                            "15px",
                                        padding:
                                            "10px 20px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    Try Again
                                </button>

                            )}

                    </div>

                )}


                {/* SUCCESS */}

                {message &&
                    message.toLowerCase().includes(
                        "success"
                    ) && (

                        <div
                            style={{
                                textAlign:
                                    "center",
                                marginTop:
                                    "20px",
                            }}
                        >

                            <h2>
                                ✅ Attendance
                                Recorded
                            </h2>

                            <p>
                                Your attendance
                                has been successfully
                                recorded.
                            </p>

                        </div>

                    )}

            </div>

        </DashboardLayout>
    );
}

export default ScanQR;