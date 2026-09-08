
import { useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import "../../styles/studentProfile.css";

import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaGraduationCap,
  FaLock,
  FaEye,
  FaEyeSlash,
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

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function handlePasswordChange(e) {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError("New passwords do not match.");
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
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password."
        );
      }

      setPasswordMessage(
        "Password changed successfully."
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setPasswordError(
        error.message ||
          "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  function togglePassword(field) {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

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


        {/* CHANGE PASSWORD */}
        <div className="password-card">

          <div className="password-card-header">

            <div className="password-icon">
              <FaLock />
            </div>

            <div>
              <h2>Change Password</h2>

              <p>
                Update your account password.
              </p>
            </div>

            <button
              type="button"
              className="password-toggle-btn"
              onClick={() =>
                setShowPasswordForm(
                  !showPasswordForm
                )
              }
            >
              {showPasswordForm
                ? "Cancel"
                : "Change Password"}
            </button>

          </div>


          {showPasswordForm && (

            <form
              className="password-form"
              onSubmit={handleChangePassword}
            >

              {/* CURRENT PASSWORD */}
              <div className="password-field">

                <label>
                  Current Password
                </label>

                <div className="password-input-wrapper">

                  <FaLock />

                  <input
                    type={
                      showPasswords.current
                        ? "text"
                        : "password"
                    }
                    name="currentPassword"
                    value={
                      passwordForm.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter current password"
                    disabled={passwordLoading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      togglePassword("current")
                    }
                  >
                    {showPasswords.current ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>


              {/* NEW PASSWORD */}
              <div className="password-field">

                <label>
                  New Password
                </label>

                <div className="password-input-wrapper">

                  <FaLock />

                  <input
                    type={
                      showPasswords.new
                        ? "text"
                        : "password"
                    }
                    name="newPassword"
                    value={
                      passwordForm.newPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter new password"
                    disabled={passwordLoading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      togglePassword("new")
                    }
                  >
                    {showPasswords.new ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>


              {/* CONFIRM PASSWORD */}
              <div className="password-field">

                <label>
                  Confirm New Password
                </label>

                <div className="password-input-wrapper">

                  <FaLock />

                  <input
                    type={
                      showPasswords.confirm
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      passwordForm.confirmPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      togglePassword("confirm")
                    }
                  >
                    {showPasswords.confirm ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>

                </div>

              </div>


              {/* ERROR */}
              {passwordError && (
                <div className="password-error">
                  {passwordError}
                </div>
              )}


              {/* SUCCESS */}
              {passwordMessage && (
                <div className="password-success">
                  {passwordMessage}
                </div>
              )}


              {/* SUBMIT */}
              <button
                type="submit"
                className="change-password-btn"
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? "Changing Password..."
                  : "Change Password"}
              </button>

            </form>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Profile;
