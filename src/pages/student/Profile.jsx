import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/studentProfile.css";

import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaGraduationCap,
  FaBuilding,
  FaEdit,
} from "react-icons/fa";

function Profile() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [editing, setEditing] = useState(false);

  return (
    <DashboardLayout
      title="Profile"
      role="student"
    >

      <div className="student-profile-page">

        {/* PAGE HEADING */}

        <div className="profile-heading">

          <div>
            <h1>My Profile</h1>

            <p>
              View and manage your personal information.
            </p>
          </div>

          

        </div>


        {/* PROFILE CARD */}

        <div className="profile-card">

          {/* PROFILE HEADER */}

          <div className="profile-card-header">

            <div className="profile-avatar">
              <FaUser />
            </div>

            <div className="profile-name">

              <h2>
                {user?.name || "Student"}
              </h2>

              <span>
                Student
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
                <FaIdCard />
              </div>

              <div>
                <span>Student ID</span>
                <strong>
                  {user?.id || "N/A"}
                </strong>
              </div>

            </div>


            <div className="profile-info-item">

              <div className="profile-info-icon">
                <FaGraduationCap />
              </div>

              <div>
                <span>Role</span>
                <strong>
                  {user?.role || "Student"}
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