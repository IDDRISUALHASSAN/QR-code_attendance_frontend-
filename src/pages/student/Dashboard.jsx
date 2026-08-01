import {
    FaBook,
    FaCalendarAlt,
    FaChartPie,
    FaQrcode
} from "react-icons/fa";

import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardCard from "../../components/DashboardCard";

function Dashboard(){

    return(

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
                    value="85%"
                    icon={<FaChartPie />}
                    color="#0d6efd"
                />

                <DashboardCard
                    title="Courses"
                    value="6"
                    icon={<FaBook />}
                    color="#20c997"
                />

                <DashboardCard
                    title="Today's Classes"
                    value="3"
                    icon={<FaCalendarAlt />}
                    color="#fd7e14"
                />

                <DashboardCard
                    title="QR Status"
                    value="Active"
                    icon={<FaQrcode />}
                    color="#dc3545"
                />

            </div>

        </DashboardLayout>

    );

}

export default Dashboard;