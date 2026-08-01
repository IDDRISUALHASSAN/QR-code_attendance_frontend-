// src/pages/VerifyOTP.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/VerifyOTP.css";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      setSuccess("Email verified successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setResendLoading(false);
        return;
      }

      setSuccess("A new verification code has been sent to your email.");
      setResendLoading(false);

    } catch (err) {
      setError("Something went wrong. Please try again.");
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-container">
      {/* Header */}
      <div className="verify-header">
        <h2>QR ATTENDANCE MANAGEMENT SYSTEM</h2>
        <p>Kumasi Technical University</p>
      </div>

      {/* Form */}
      <div className="verify-form-container">
        <h3>Verify Your Email</h3>
        <p>
          A verification code was sent to{" "}
          <span className="email-tag">{email}</span>. Enter it below to
          complete your registration.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              placeholder="Enter OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            className="verify-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "VERIFY EMAIL"}
          </button>
        </form>

        <div className="verify-footer">
          <p>
            Did not receive the code?{" "}
            <span
              onClick={handleResend}
              className={resendLoading ? "disabled-link" : ""}
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </span>
          </p>
          <p>
            <span onClick={() => navigate("/")}>Back to Home</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;