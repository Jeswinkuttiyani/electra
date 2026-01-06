import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AuthPages.css";
import "../styles/AdminSignup.css";

function AdminSignup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation rules
  const validatePassword = (pwd) => {
    const errors = [];
    
    if (pwd.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push("Password must contain at least one special character (!@#$%^&* etc)");
    }
    
    return errors;
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword) {
      setPasswordErrors(validatePassword(newPassword));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setPasswordErrors([]);

    // Validation
    if (!email) {
      setMessageType("error");
      setMessage("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address");
      return;
    }

    if (!password) {
      setMessageType("error");
      setMessage("Password is required");
      return;
    }

    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      setPasswordErrors(pwdErrors);
      setMessageType("error");
      setMessage("Password does not meet the requirements");
      return;
    }

    if (!confirmPassword) {
      setMessageType("error");
      setMessage("Please confirm your password");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/admin-signup", {
        email,
        password,
      });

      if (response.data.success) {
        setMessageType("success");
        setMessage("Admin account created successfully!");
        
        // Clear form
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Admin signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Admin Registration</h2>
        <p className="auth-subtitle">Create your admin account</p>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSignup}>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setMessage("");
              }}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter a strong password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            
            {/* Password Requirements */}
            {password && (
              <div className="password-requirements">
                <p className="requirements-title">Password Requirements:</p>
                <ul>
                  <li className={password.length >= 8 ? "valid" : "invalid"}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "valid" : "invalid"}>
                    One uppercase letter (A-Z)
                  </li>
                  <li className={/[a-z]/.test(password) ? "valid" : "invalid"}>
                    One lowercase letter (a-z)
                  </li>
                  <li className={/[0-9]/.test(password) ? "valid" : "invalid"}>
                    One number (0-9)
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "valid" : "invalid"}>
                    One special character (!@#$%^&* etc)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setMessage("");
                }}
                placeholder="Re-enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            
            {confirmPassword && password !== confirmPassword && (
              <p className="error-text">Passwords do not match</p>
            )}
            
            {confirmPassword && password === confirmPassword && (
              <p className="success-text">Passwords match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading || passwordErrors.length > 0}
          >
            {loading ? "Creating Account..." : "Create Admin Account"}
          </button>
        </form>

        {/* Login Link */}
        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <a href="/login">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminSignup;
