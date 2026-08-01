import { useEffect, useState } from "react";
import QRCode from "qrcode";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";

import "../../styles/myCourses.css";

function MyCourses() {

    const [courses, setCourses] = useState([]);

    const [loading, setLoading] = useState(true);

    const [session, setSession] = useState(null);
    const [qrSrc, setQrSrc] = useState("");

    const user =
        JSON.parse(localStorage.getItem("user"));

    useEffect(() => {

        loadCourses();

    }, []);

    useEffect(() => {
        if (!session?.qrToken) {
            setQrSrc("");
            return;
        }

        QRCode.toDataURL(session.qrToken)
            .then((url) => setQrSrc(url))
            .catch((error) => {
                console.error("QR code generation failed", error);
                setQrSrc("");
            });
    }, [session]);

    async function loadCourses() {

        try {

            const response =
                await fetch(
                    `/api/course-assignments/lecturer/${user.id}`
                );

            const data =
                await response.json();

            setCourses(data.assignments);

        } catch (error) {

            console.log(error);

        }

        setLoading(false);

    }

    async function startAttendance(courseAssignmentId) {

        try {

            const response =
                await fetch(
                    "/api/attendance-sessions/start",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                        },

                        body: JSON.stringify({

                            courseAssignmentId,

                        }),

                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                alert(data.message);

                return;

            }

            setSession(data.session);

        } catch (error) {

            console.log(error);

        }

    }

    if (loading) {

        return <Loading />;

    }

    return (

        <DashboardLayout
            title="My Courses"
            role="lecturer"
        >

            <PageHeader

                title="My Courses"

                subtitle="Generate attendance QR"

            />

            {

                courses.map((item)=>(

                    <div
                        key={item._id}
                        className="course-card"
                    >

                        <h2>

                            {item.course.courseName}

                        </h2>

                        <p>

                            {item.course.courseCode}

                        </p>

                        <p>

                            {item.academicYear}

                        </p>

                        <p>

                            {item.semester}

                        </p>

                        <button

                            onClick={()=>

                                startAttendance(
                                    item._id
                                )

                            }

                        >

                            Start Attendance

                        </button>

                    </div>

                ))

            }

            {

                session && (

                    <div className="qr-box">

                        <h2>

                            Attendance QR

                        </h2>

                        {qrSrc ? (
                            <img
                                src={qrSrc}
                                alt="Attendance QR"
                                width={250}
                                height={250}
                            />
                        ) : (
                            <p>Loading QR code…</p>
                        )}

                        <p>

                            Session Active

                        </p>

                    </div>

                )

            }

        </DashboardLayout>

    );

}

export default MyCourses;