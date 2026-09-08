
import { useEffect, useState } from "react";

import {
    FaUsers,
    FaChartBar,
    FaCogs,
    FaBook,
    FaUserPlus,
    FaChalkboardTeacher,
    FaArrowRight,
    FaUserGraduate,
    FaClipboardCheck,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";

import DashboardCard from "../../components/DashboardCard";

import API_URL from "../../config/api";

function Dashboard() {

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalLecturers: 0,
        totalCourses: 0,
        activeSessions: 0,
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const response = await fetch(`${API_URL}/api/dashboard/admin`);

            const data = await response.json();

            setStats(data);

        } catch (error) {
            console.log(error);
        }
    }

    return (

        <DashboardLayout
            title="Admin Dashboard"
            role="admin"
        >

            <div className="admin-dashboard">

                {/* =========================
                    PAGE HEADER
                   ========================= */}

                <div className="admin-dashboard-header">

                    <div className="admin-header-content">

                        <div className="admin-header-icon">
                            <FaChartBar />
                        </div>

                        <div>
                            <span className="admin-header-label">
                                ADMINISTRATION
                            </span>

                            <h1>
                                Admin Console
                            </h1>

                            <p>
                                Monitor your system, manage users and
                                keep attendance operations running smoothly.
                            </p>
                        </div>

                    </div>

                    <div className="admin-system-status">
                        <span></span>
                        System Online
                    </div>

                </div>


                {/* =========================
                    STATISTICS
                   ========================= */}

                <div className="cards admin-stat-cards">

                    <DashboardCard
                        title="Students"
                        value={stats.totalStudents}
                        subtitle="Registered Students"
                        icon={<FaUsers />}
                        color="#2563eb"
                    />

                    <DashboardCard
                        title="Lecturers"
                        value={stats.totalLecturers}
                        subtitle="Registered Lecturers"
                        icon={<FaChalkboardTeacher />}
                        color="#20c997"
                    />

                    <DashboardCard
                        title="Courses"
                        value={stats.totalCourses}
                        subtitle="Available Courses"
                        icon={<FaBook />}
                        color="#f59e0b"
                    />

                    <DashboardCard
                        title="Active Sessions"
                        value={stats.activeSessions}
                        subtitle="Running Right Now"
                        icon={<FaChartBar />}
                        color="#ef4444"
                    />

                </div>


                {/* =========================
                    ADMIN QUICK ACTIONS
                   ========================= */}

                <div className="admin-section-heading">

                    <div>
                        <span>QUICK ACTIONS</span>

                        <h2>
                            Manage your system
                        </h2>
                    </div>

                    <p>
                        Common administrative tasks
                    </p>

                </div>


                <div className="admin-action-grid">

                    {/* Add Student */}

                    <NavLink
                        to="/admin/add-student"
                        className="admin-action-card admin-student-action"
                    >

                        <div className="admin-action-icon">
                            <FaUserGraduate />
                        </div>

                        <div className="admin-action-content">

                            <span className="admin-action-label">
                                STUDENTS
                            </span>

                            <h3>
                                Add Student
                            </h3>

                            <p>
                                Register a new student and add their
                                academic information to the system.
                            </p>

                        </div>

                        <div className="admin-action-arrow">
                            <FaArrowRight />
                        </div>

                    </NavLink>


                    {/* Add Lecturer */}

                    <NavLink
                        to="/admin/add-lecturer"
                        className="admin-action-card admin-lecturer-action"
                    >

                        <div className="admin-action-icon">
                            <FaChalkboardTeacher />
                        </div>

                        <div className="admin-action-content">

                            <span className="admin-action-label">
                                LECTURERS
                            </span>

                            <h3>
                                Add Lecturer
                            </h3>

                            <p>
                                Create a lecturer account and manage
                                teaching staff information.
                            </p>

                        </div>

                        <div className="admin-action-arrow">
                            <FaArrowRight />
                        </div>

                    </NavLink>


                    {/* Assign Course */}

                    <NavLink
                        to="/admin/assign-course"
                        className="admin-action-card admin-course-action"
                    >

                        <div className="admin-action-icon">
                            <FaBook />
                        </div>

                        <div className="admin-action-content">

                            <span className="admin-action-label">
                                ACADEMICS
                            </span>

                            <h3>
                                Assign Course
                            </h3>

                            <p>
                                Assign courses to lecturers and manage
                                course responsibilities.
                            </p>

                        </div>

                        <div className="admin-action-arrow">
                            <FaArrowRight />
                        </div>

                    </NavLink>


                    {/* Attendance */}

                    <NavLink
                        to="/admin/attendance"
                        className="admin-action-card admin-attendance-action"
                    >

                        <div className="admin-action-icon">
                            <FaClipboardCheck />
                        </div>

                        <div className="admin-action-content">

                            <span className="admin-action-label">
                                ATTENDANCE
                            </span>

                            <h3>
                                Attendance Records
                            </h3>

                            <p>
                                Review attendance activity and monitor
                                active attendance sessions.
                            </p>

                        </div>

                        <div className="admin-action-arrow">
                            <FaArrowRight />
                        </div>

                    </NavLink>

                </div>


                {/* =========================
                    MANAGEMENT BANNER
                   ========================= */}

                <div className="admin-management-banner">

                    <div className="admin-banner-icon">
                        <FaCogs />
                    </div>

                    <div className="admin-banner-content">

                        <span>
                            SYSTEM MANAGEMENT
                        </span>

                        <h3>
                            Keep your attendance system organized
                        </h3>

                        <p>
                            Manage students, lecturers, courses and
                            attendance from one central dashboard.
                        </p>

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );
}

export default Dashboard;
