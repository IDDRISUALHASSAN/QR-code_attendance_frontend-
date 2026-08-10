import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/lecturerProfile.css";

import {
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaBuilding,
} from "react-icons/fa";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <DashboardLayout title="Profile" role="lecturer">
      <div className="lecturer-profile-page">

        <div className="profile-heading">
          <div>
            <h1>My Profile</h1>
            <p>View your lecturer account information.</p>
          </div>
        </div>

        <div className="profile-card">

          {/* PROFILE HEADER */}
          <div className="profile-card-header">

            <div className="profile-avatar">
              <FaUser />
            </div>

            <div className="profile-name">
              <h2>{user?.name || "Lecturer"}</h2>

              <span>
                {user?.role || "Lecturer"}
              </span>
            </div>

          </div>

          {/* INFORMATION */}
          <div className="profile-information">

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <FaUser />
              </div>

              <div>
                <span>Full Name</span>
                <strong>
                  {user?.name || "N/A"}
                </strong>
              </div>
            </div>


            <div className="profile-info-item">
              <div className="profile-info-icon">
                <FaEnvelope />
              </div>

              <div>
                <span>Email Address</span>
                <strong>
                  {user?.email || "N/A"}
                </strong>
              </div>
            </div>


            <div className="profile-info-item">
              <div className="profile-info-icon">
                <FaIdBadge />
              </div>

              <div>
                <span>Staff ID</span>
                <strong>
                  {user?.staffId || "N/A"}
                </strong>
              </div>
            </div>


            <div className="profile-info-item">
              <div className="profile-info-icon">
                <FaBuilding />
              </div>

              <div>
                <span>Department</span>
                <strong>
                  {user?.department || "N/A"}
                </strong>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Profile;