import {
	FaUsers,
	FaChartBar,
	FaCogs,
	FaBook
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardCard from "../../components/DashboardCard";

function Dashboard(){

	return(

		<DashboardLayout
			title="Admin Dashboard"
			role="admin"
		>

			<h1>
				Admin Console
			</h1>

			<p>
				Manage users and system settings.
			</p>

			<div className="cards">

				<DashboardCard
					title="Total Users"
					value="--"
					icon={<FaUsers />}
					color="#0d6efd"
				/>

				<DashboardCard
					title="System Health"
					value="--"
					icon={<FaChartBar />}
					color="#20c997"
				/>

				<DashboardCard
					title="Settings"
					value="--"
					icon={<FaCogs />}
					color="#fd7e14"
				/>

				<NavLink to="/admin/assign-course" className="card-link">
					<DashboardCard
						title="Assign Course"
						value="--"
						icon={<FaBook />}
						color="#6f42c1"
					/>
				</NavLink>

			</div>

		</DashboardLayout>

	);

}

export default Dashboard;
