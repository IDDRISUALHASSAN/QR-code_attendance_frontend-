import { useEffect, useState } from "react";
import { FaUsers, FaChartBar, FaCogs, FaBook } from "react-icons/fa";
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

            <h1>Admin Console</h1>

            <p>
                Manage users and system settings.
            </p>

            <div className="cards">

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
                    icon={<FaUsers />}
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

                <NavLink
                    to="/admin/assign-course"
                    className="card-link"
                >
                    <DashboardCard
                        title="Assign Course"
                        value="Manage"
                        icon={<FaCogs />}
                        color="#6f42c1"
                    />
                </NavLink>

            </div>

        </DashboardLayout>

    );

}

export default Dashboard;