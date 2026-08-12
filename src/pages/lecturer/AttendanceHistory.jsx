import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/PageHeader";
import API_URL from "../../config/api";

function AttendanceHistory() {

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    async function loadSessions() {

        try {

            const user = JSON.parse(localStorage.getItem("user"));

                        const response = await fetch(
                    `${API_URL}/api/attendance/lecturer/${user.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

            const data = await response.json();

            setSessions(data.sessions);

        }

        catch (error) {

            console.log(error);

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <DashboardLayout
            title="Attendance History"
            role="lecturer"
        >

            <PageHeader
                title="Attendance History"
                subtitle="View all attendance sessions."
            />

            {
                loading ?

                <h2>Loading...</h2>

                :

                sessions.length === 0 ?

                <h2>No Attendance Sessions Found</h2>

                :

                <table className="attendance-table">

                    <thead>

                        <tr>

                            <th>Course</th>
                            <th>Code</th>
                            <th>Status</th>
                            <th>Students</th>
                            <th>Date</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            sessions.map(session => (

                                <tr key={session._id}>

                                    <td>
                                        {session.course.courseName}
                                    </td>

                                    <td>
                                        {session.course.courseCode}
                                    </td>

                                    <td>
                                        {session.status}
                                    </td>

                                    <td>
                                        {session.totalStudents}
                                    </td>

                                    <td>
                                        {new Date(session.startTime).toLocaleString()}
                                    </td>

                                    <td>

                                                                        <Link
                                    to={`/lecturer/attendance/${session.id}`}
                                >
                                    View
                                </Link>

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            }

        </DashboardLayout>

    );

}

export default AttendanceHistory;