import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/forgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);
      navigate("/verify-reset-code", { state: { email } });
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="logo-area">
        <h1>QRAMS</h1>
        <span>QR Attendance Management System   .  . </span>
      </div>

      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p>
          Enter your registered email address. We’ll send you a verification
          code to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <Link to="/login" className="back-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
