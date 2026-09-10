import { useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import "../../styles/lecturerProfile.css";

import {
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaBuilding,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import API_URL from "../../config/api";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  // =========================
  // CHANGE PASSWORD STATE
  // =========================

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

  // =========================
  // CHANGE PASSWORD
  // =========================

  async function handleChangePassword(e) {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    // Check empty fields
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );

      return;
    }

    // Minimum password length
    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );

      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );

      return;
    }

    // Prevent same password
    if (currentPassword === newPassword) {
      setPasswordError(
        "Your new password must be different from your current password."
      );

      return;
    }

    try {
      setPasswordLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to change password."
        );
      }

      // Success message
      setPasswordMessage(
        "Password changed successfully."
      );

      // Clear form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Hide passwords
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
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

  // =========================
  // TOGGLE PASSWORD VISIBILITY
  // =========================

  function togglePassword(field) {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  // =========================
  // PAGE
  // =========================

  return (
    <DashboardLayout
      title="Profile"
      role="lecturer"
    >
      <div className="lecturer-profile-page">

        {/* =====================================
            PAGE HEADER
        ====================================== */}

        <div className="profile-heading">

          <div>
            <h1>My Profile</h1>

            <p>
              View your lecturer account information
              and manage your account security.
            </p>
          </div>

        </div>


        {/* =====================================
            PROFILE CARD
        ====================================== */}

        <div className="profile-card">

          {/* PROFILE HEADER */}

          <div className="profile-card-header">

            <div className="profile-avatar">
              <FaUser />
            </div>

            <div className="profile-name">

              <h2>
                {user?.name || "Lecturer"}
              </h2>

              <span>
                Lecturer
              </span>

            </div>

          </div>


          {/* =====================================
              PROFILE INFORMATION
          ====================================== */}

          <div className="profile-information">

            {/* FULL NAME */}

            <div className="profile-info-item">

              <div className="profile-info-icon">
                <FaUser />
              </div>

              <div>

                <span>
                  Full Name
                </span>

                <strong>
                  {user?.name || "N/A"}
                </strong>

              </div>

            </div>


            {/* EMAIL */}

            <div className="profile-info-item">

              <div className="profile-info-icon">
                <FaEnvelope />
              </div>

              <div>

                <span>
                  Email Address
                </span>

                <strong>
                  {user?.email || "N/A"}
                </strong>

              </div>

            </div>


            {/* STAFF ID */}

            <div className="profile-info-item">

              <div className="profile-info-icon">
                <FaIdBadge />
              </div>

              <div>

                <span>
                  Staff ID
                </span>

                <strong>
                  {user?.staffId || "N/A"}
                </strong>

              </div>

            </div>


            {/* DEPARTMENT */}

            <div className="profile-info-item">

              <div className="profile-info-icon">
                <FaBuilding />
              </div>

              <div>

                <span>
                  Department
                </span>

                <strong>
                  {user?.department || "N/A"}
                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================
            CHANGE PASSWORD CARD
        ====================================== */}

        <div className="change-password-card">

          {/* PASSWORD HEADER */}

          <div className="change-password-header">

            <div className="password-header-icon">
              <FaLock />
            </div>

            <div>

              <h2>
                Change Password
              </h2>

              <p>
                Update your account password to
                keep your account secure.
              </p>

            </div>

          </div>


          {/* SUCCESS MESSAGE */}

          {passwordMessage && (

            <div className="password-success">
              {passwordMessage}
            </div>

          )}


          {/* ERROR MESSAGE */}

          {passwordError && (

            <div className="password-error">
              {passwordError}
            </div>

          )}


          {/* PASSWORD FORM */}

          <form
            onSubmit={handleChangePassword}
          >

            {/* =================================
                CURRENT PASSWORD
            ================================== */}

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

                  autoComplete="current-password"

                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    togglePassword("current")
                  }

                  className="password-toggle"

                  title={
                    showPasswords.current
                      ? "Hide password"
                      : "Show password"
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


            {/* =================================
                NEW PASSWORD
            ================================== */}

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

                  autoComplete="new-password"

                  minLength={6}

                  required
                />

                <button
                  type="button"

                  onClick={() =>
                    togglePassword("new")
                  }

                  className="password-toggle"

                  title={
                    showPasswords.new
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPasswords.new ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}

                </button>

              </div>

              <small>
                Password must be at least
                6 characters.
              </small>

            </div>


            {/* =================================
                CONFIRM PASSWORD
            ================================== */}

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

                  autoComplete="new-password"

                  minLength={6}

                  required
                />

                <button
                  type="button"

                  onClick={() =>
                    togglePassword("confirm")
                  }

                  className="password-toggle"

                  title={
                    showPasswords.confirm
                      ? "Hide password"
                      : "Show password"
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


            {/* =================================
                SUBMIT BUTTON
            ================================== */}

            <button
              type="submit"

              className="change-password-btn"

              disabled={passwordLoading}
            >

              <FaLock />

              {passwordLoading
                ? "Changing Password..."
                : "Change Password"}

            </button>

          </form>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Profile;