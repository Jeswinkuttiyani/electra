import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AuthPages.css";

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("voter"); // "voter" or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("/login", {
        email,
        password,
        userType,
      });

      setMessageType("success");
      setMessage(res.data.message || "Login successful!");
      
      // Store user info and redirect after short delay
      localStorage.setItem("userType", userType);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email", email);
      
      // Store all voter-specific fields if available
      if (res.data.name) {
        localStorage.setItem("name", res.data.name);
      }
      if (res.data.voter_id) {
        localStorage.setItem("voterId", res.data.voter_id);
      }
      if (res.data.full_name) {
        localStorage.setItem("fullName", res.data.full_name);
      }
      if (res.data.email) {
        localStorage.setItem("email", res.data.email);
      }
      if (res.data.phone_no) {
        localStorage.setItem("phoneNo", res.data.phone_no);
      }
      if (res.data.address) {
        localStorage.setItem("address", res.data.address);
      }
      if (res.data.date_of_birth) {
        localStorage.setItem("dob", res.data.date_of_birth);
      }
      if (res.data.branch_name) {
        localStorage.setItem("branchName", res.data.branch_name);
      }
      if (res.data.photo_url) {
        localStorage.setItem("photoUrl", res.data.photo_url);
      }
      
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(userType);
        }
        // Redirect to appropriate dashboard
        if (userType === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/voter-dashboard");
        }
      }, 1000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="app-title">ELECTRON</div>
      
      <div className="auth-card">
        {/* User Type Switch */}
        <div className="user-type-switch">
          <button
            type="button"
            className={`switch-btn ${userType === "voter" ? "active" : ""}`}
            onClick={() => setUserType("voter")}
          >
            Voter
          </button>
          <button
            type="button"
            className={`switch-btn ${userType === "admin" ? "active" : ""}`}
            onClick={() => setUserType("admin")}
          >
            Admin
          </button>
        </div>

        <h1 className="welcome-title">
          Welcome {userType === "admin" ? "Admin" : "Voter"}
        </h1>
        <p className="welcome-subtitle">Sign in to continue</p>

        {/* Message Display */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-footer">
            <div className="remember-me">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="auth-btn">
            Sign In
          </button>
        </form>

      {/* Sign Up Link - Conditional based on userType */}
{userType === "voter" ? (
  <p className="auth-link">
    Don't have an account? <a href="/signup">Register as Voter</a>
  </p>
) : (
  <p className="auth-link">
    Admin? <a href="/admin-signup">Register as Admin</a>
  </p>
)}
      </div>
    </div>
  );
}

export default Login;