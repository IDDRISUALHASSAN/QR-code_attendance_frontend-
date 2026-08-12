import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";


import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";



function ScanQR() {

    const [scanning, setScanning] = useState(true);

    const [message, setMessage] = useState("");

    const student =
        JSON.parse(localStorage.getItem("user"));

    async function handleScan(result) {

        if (!result || !scanning) return;

        setScanning(false);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/attendance/scan`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                        },

                        body: JSON.stringify({

                            qrToken: result[0].rawValue,

                            studentId: student.id,

                        }),

                    }

                );

            const data =
                await response.json();

            setMessage(data.message);

        }

        catch (error) {

            console.log(error);

            setMessage("Server Error");

        }

    }

    return (

        <DashboardLayout
            title="Scan QR"
            role="student"
        >

            <PageHeader

                title="Scan Attendance"

                subtitle="Point your camera at the lecturer's QR Code."

            />

            {

                scanning && (
<Scanner
    constraints={{
        facingMode: {
            ideal: "environment",
        },
    }}
    scanDelay={500}
    onScan={handleScan}
    onError={(error) => {
        console.log(error);
        setMessage(error.message);
    }}
/>

                )

            }

            {

                message && (

                    <div
                        className="scan-message"
                    >

                        <h2>

                            {message}

                        </h2>

                    </div>

                )

            }

        </DashboardLayout>

    );

}

export default ScanQR;