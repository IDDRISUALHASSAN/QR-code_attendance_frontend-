import { useEffect, useState } from "react";

import {
    FaBook,
    FaCalendarAlt,
    FaChartPie,
    FaQrcode
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardCard from "../../components/DashboardCard";
import API_URL from "../../config/api";

function Dashboard() {
    const [stats, setStats] = useState({
        attendance: 0,
        courses: 0,
        todaysClasses: 0,
        qrStatus: "Inactive"
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");
                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

                const studentId =
                    storedUser?.id ||
                    storedUser?._id ||
                    storedUser?.userId;

                if (!token || !studentId) {
                    setLoading(false);
                    return;
                }

                /*
                 * 1. Get student's attendance history
                 */
                const attendanceResponse = await fetch(
                    `${API_URL}/api/attendance/student/${studentId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                let attendanceRecords = [];

                if (attendanceResponse.ok) {
                    const attendanceData = await attendanceResponse.json();

                    attendanceRecords =
                        attendanceData.attendance ||
                        attendanceData.records ||
                        [];
                }

                /*
                 * Calculate attendance percentage
                 *
                 * Present records / total attendance records
                 */
                const totalAttendance = attendanceRecords.length;

                const presentAttendance = attendanceRecords.filter(
                    (record) =>
                        record.status?.toLowerCase() === "present"
                ).length;

                const attendanceRate =
                    totalAttendance > 0
                        ? Math.round(
                              (presentAttendance / totalAttendance) * 100
                          )
                        : 0;

                /*
                 * 2. Get student's course assignments
                 */
                const coursesResponse = await fetch(
                    `${API_URL}/api/course-assignments`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                let courseAssignments = [];

                if (coursesResponse.ok) {
                    const courseData = await coursesResponse.json();

                    courseAssignments =
                        courseData.assignments ||
                        courseData.courseAssignments ||
                        courseData.data ||
                        [];
                }

                /*
                 * Keep only assignments belonging to this student.
                 *
                 * Different backend responses may store the student
                 * as either an object or an ID.
                 */
                const studentCourses = courseAssignments.filter((assignment) => {
                    const assignmentStudent =
                        assignment.student ||
                        assignment.studentId;

                    if (!assignmentStudent) return false;

                    const assignmentStudentId =
                        typeof assignmentStudent === "object"
                            ? assignmentStudent._id || assignmentStudent.id
                            : assignmentStudent;

                    return String(assignmentStudentId) === String(studentId);
                });

                /*
                 * 3. Today's classes
                 *
                 * If the assignment contains a day/schedule field,
                 * use it to determine today's classes.
                 */
                const today = new Date();

                const dayNames = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                ];

                const todayName = dayNames[today.getDay()];

                const todaysClasses = studentCourses.filter((assignment) => {
                    const schedule =
                        assignment.schedule ||
                        assignment.day ||
                        assignment.days;

                    if (!schedule) return false;

                    if (Array.isArray(schedule)) {
                        return schedule.some(
                            (day) =>
                                String(day).toLowerCase() ===
                                todayName.toLowerCase()
                        );
                    }

                    return String(schedule)
                        .toLowerCase()
                        .includes(todayName.toLowerCase());
                }).length;

                /*
                 * 4. Check for active QR attendance sessions
                 */
                const sessionsResponse = await fetch(
                    `${API_URL}/api/attendance-sessions`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                let qrStatus = "Inactive";

                if (sessionsResponse.ok) {
                    const sessionData = await sessionsResponse.json();

                    const sessions =
                        sessionData.sessions ||
                        sessionData.data ||
                        [];

                    const now = new Date();

                    const activeSession = sessions.some((session) => {
                        if (session.status !== "active") return false;

                        if (!session.endTime) return true;

                        return new Date(session.endTime) > now;
                    });

                    qrStatus = activeSession ? "Active" : "Inactive";
                }

                /*
                 * Update dashboard
                 */
                setStats({
                    attendance: attendanceRate,
                    courses: studentCourses.length,
                    todaysClasses,
                    qrStatus
                });
            } catch (error) {
                console.error(
                    "Error loading student dashboard:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    return (
        <DashboardLayout
            title="Student Dashboard"
            role="student"
        >
            <h1>
                Welcome Back 👋
            </h1>

            <p>
                Manage your attendance from here.
            </p>

            <div className="cards">
                <DashboardCard
                    title="Attendance"
                    value={
                        loading
                            ? "..."
                            : `${stats.attendance}%`
                    }
                    icon={<FaChartPie />}
                    color="#0d6efd"
                />

                <DashboardCard
                    title="Courses"
                    value={
                        loading
                            ? "..."
                            : stats.courses
                    }
                    icon={<FaBook />}
                    color="#20c997"
                />

                <DashboardCard
                    title="Today's Classes"
                    value={
                        loading
                            ? "..."
                            : stats.todaysClasses
                    }
                    icon={<FaCalendarAlt />}
                    color="#fd7e14"
                />

                <DashboardCard
                    title="QR Status"
                    value={
                        loading
                            ? "..."
                            : stats.qrStatus
                    }
                    icon={<FaQrcode />}
                    color="#dc3545"
                />
            </div>
        </DashboardLayout>
    );
}

export default Dashboard;