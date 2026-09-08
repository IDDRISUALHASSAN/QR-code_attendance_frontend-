
import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../styles/adminProfile.css";

import {
  FaUserShield,
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaLock,
  FaKey,
  FaCheckCircle,
} from "react-icons/fa";

import API_URL from "../../config/api";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      alert("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    try {
      setPasswordLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword:
              passwordForm.currentPassword,
            newPassword:
              passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password."
        );
      }

      alert("Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);

    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      alert(error.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Admin Profile"
      role="admin"
    >
      <div className="admin-profile-page">

        {/* PAGE HEADER */}

        <div className="admin-profile-heading">

          <div className="admin-profile-heading-icon">
            <FaUserShield />
          </div>

          <div>
            <span>ACCOUNT SETTINGS</span>

            <h1>Admin Profile</h1>

            <p>
              Manage your administrator account and
              security settings.
            </p>
          </div>

        </div>


        {/* PROFILE CARD */}

        <div className="admin-profile-card">

          {/* PROFILE HEADER */}

          <div className="admin-profile-card-header">

            <div className="admin-profile-avatar">
              <FaUserShield />
            </div>

            <div className="admin-profile-name">

              <span className="admin-profile-role">
                SYSTEM ADMINISTRATOR
              </span>

              <h2>
                {user?.name || "Administrator"}
              </h2>

              <div className="admin-profile-status">
                <FaCheckCircle />
                Account Active
              </div>

            </div>

          </div>


          {/* ACCOUNT INFORMATION */}

          <div className="admin-profile-section">

            <div className="admin-section-title">

              <div className="admin-section-title-icon">
                <FaUser />
              </div>

              <div>
                <h3>Account Information</h3>

                <p>
                  Your administrator account details.
                </p>
              </div>

            </div>


            <div className="admin-profile-information">

              <div className="admin-profile-info-item">

                <div className="admin-info-icon">
                  <FaUser />
                </div>

                <div>
                  <span>Full Name</span>

                  <strong>
                    {user?.name || "N/A"}
                  </strong>
                </div>

              </div>


              <div className="admin-profile-info-item">

                <div className="admin-info-icon">
                  <FaEnvelope />
                </div>

                <div>
                  <span>Email Address</span>

                  <strong>
                    {user?.email || "N/A"}
                  </strong>
                </div>

              </div>


              <div className="admin-profile-info-item">

                <div className="admin-info-icon">
                  <FaShieldAlt />
                </div>

                <div>
                  <span>Account Role</span>

                  <strong>
                    {user?.role || "Admin"}
                  </strong>
                </div>

              </div>


              <div className="admin-profile-info-item">

                <div className="admin-info-icon">
                  <FaCheckCircle />
                </div>

                <div>
                  <span>Account Status</span>

                  <strong className="admin-verified">
                    Active
                  </strong>
                </div>

              </div>

            </div>

          </div>


          {/* SECURITY SECTION */}

          <div className="admin-security-section">

            <div className="admin-security-icon">
              <FaLock />
            </div>

            <div className="admin-security-content">

              <span>ACCOUNT SECURITY</span>

              <h3>Password & Security</h3>

              <p>
                Keep your administrator account secure by
                regularly updating your password.
              </p>

            </div>

            <button
              type="button"
              className="admin-change-password-btn"
              onClick={() =>
                setShowPasswordForm(true)
              }
            >
              <FaKey />
              Change Password
            </button>

          </div>

        </div>


        {/* SECURITY NOTICE */}

        <div className="admin-security-notice">

          <div className="notice-icon">
            <FaShieldAlt />
          </div>

          <div>
            <h3>Protect your administrator account</h3>

            <p>
              Use a strong password that is difficult to
              guess. Never share your administrator
              password with other users.
            </p>
          </div>

        </div>


        {/* CHANGE PASSWORD MODAL */}

        {showPasswordForm && (

          <div
            className="admin-modal-overlay"
            onClick={() => {
              if (!passwordLoading) {
                setShowPasswordForm(false);
              }
            }}
          >

            <div
              className="admin-password-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="admin-modal-header">

                <div className="admin-modal-icon">
                  <FaLock />
                </div>

                <div>

                  <span>ACCOUNT SECURITY</span>

                  <h2>Change Password</h2>

                  <p>
                    Update your administrator password.
                  </p>

                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  disabled={passwordLoading}
                  onClick={() =>
                    setShowPasswordForm(false)
                  }
                >
                  ×
                </button>

              </div>


              <form
                onSubmit={handleChangePassword}
                className="admin-password-form"
              >

                <label>
                  Current Password

                  <input
                    type="password"
                    value={
                      passwordForm.currentPassword
                    }
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword:
                          e.target.value,
                      })
                    }
                    placeholder="Enter your current password"
                    required
                  />
                </label>


                <label>
                  New Password

                  <input
                    type="password"
                    value={
                      passwordForm.newPassword
                    }
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword:
                          e.target.value,
                      })
                    }
                    placeholder="Enter your new password"
                    minLength={6}
                    required
                  />

                  <small>
                    Password must contain at least
                    6 characters.
                  </small>
                </label>


                <label>
                  Confirm New Password

                  <input
                    type="password"
                    value={
                      passwordForm.confirmPassword
                    }
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword:
                          e.target.value,
                      })
                    }
                    placeholder="Confirm your new password"
                    minLength={6}
                    required
                  />
                </label>


                <div className="admin-password-actions">

                  <button
                    type="button"
                    className="admin-cancel-btn"
                    disabled={passwordLoading}
                    onClick={() =>
                      setShowPasswordForm(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-password-btn"
                    disabled={passwordLoading}
                  >
                    <FaKey />

                    {passwordLoading
                      ? "Changing..."
                      : "Change Password"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>
    </DashboardLayout>
  );
}

export default Profile;
