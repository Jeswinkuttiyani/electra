import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AuthPages.css";

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Name & Voter ID, 2: OTP, 3: Password
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [voterId, setVoterId] = useState("");
  const [voterIdVerified, setVoterIdVerified] = useState(false);
  const [voterInfo, setVoterInfo] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyVoterId = async () => {
    if (!voterId) {
      setMessageType("error");
      setMessage("Please enter Voter ID");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/verify-voter-id", { voter_id: voterId });

      if (response.data.success) {
        setVoterIdVerified(true);
        setVoterInfo(response.data);
        setEmail(response.data.email); // Get email from voter record
        setMessageType("success");
        setMessage(`Voter ID verified! Name: ${response.data.voter_name}`);
        setStep(2); // Move to OTP step
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Voter ID verification failed");
      setVoterIdVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!voterId || !voterInfo) {
      setMessageType("error");
      setMessage("Please verify Voter ID first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/send-otp", {
        voter_id: voterId,
        email: voterInfo.email
      });

      if (response.data.success) {
        setOtpSent(true);
        setMessageType("success");
        setMessage("OTP has been sent to your registered email address. Please check your inbox.");
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setMessageType("error");
      setMessage("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/verify-otp", {
        voter_id: voterId,
        otp: otp
      });

      if (response.data.success) {
        setOtpVerified(true);
        setMessageType("success");
        setMessage("OTP verified successfully!");
        setStep(3); // Move to password step
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match!");
      return;
    }

    if (password.length !== 6 || !/^\d+$/.test(password)) {
      setMessageType("error");
      setMessage("Password must be exactly 6 digits!");
      return;
    }

    if (!otpVerified) {
      setMessageType("error");
      setMessage("Please verify OTP first");
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        name: name,
        voter_id: voterId,
        otp: otp,
        password: password,
        userType: "voter"
      };

      const res = await api.post("/signup", signupData);

      setMessageType("success");
      setMessage(res.data.message || "Signup successful! Redirecting to login...");

      // Redirect to login after delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="app-title">ELECTRA</div>
      
      <div className="auth-card">
        <h1 className="welcome-title">Voter Registration</h1>
        <p className="welcome-subtitle">Create your account</p>

        {/* Message Display */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Step 1: Name and Voter ID */}
        {step === 1 && (
          <div className="signup-step">
            <h2 className="step-title">Step 1: Enter Your Details</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyVoterId(); }} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="voterId">Voter ID * (4 digits)</label>
                <div className="voter-id-group">
                  <input
                    id="voterId"
                    type="text"
                    placeholder="0000"
                    value={voterId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setVoterId(value);
                      setVoterIdVerified(false);
                    }}
                    maxLength={4}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="verify-btn"
                    onClick={handleVerifyVoterId}
                    disabled={loading || !voterId}
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="signup-step">
            <h2 className="step-title">Step 2: Verify Email</h2>
            <p className="info-text">OTP has been sent to your registered email address</p>
            
            {!otpSent ? (
              <button
                type="button"
                className="auth-btn"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otp">Enter 6-Digit OTP *</label>
                  <input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    maxLength={6}
                    required
                    disabled={loading || otpVerified}
                  />
                </div>
                <button
                  type="submit"
                  className="auth-btn"
                  disabled={loading || otp.length !== 6 || otpVerified}
                >
                  {loading ? "Verifying..." : otpVerified ? "Verified ✓" : "Verify OTP"}
                </button>
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </form>
            )}
            
            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <form onSubmit={handleSignup} className="auth-form">
            <h2 className="step-title">Step 3: Set Password</h2>
            <p className="info-text">Password must be exactly 6 digits</p>

            <div className="form-group">
              <label htmlFor="password">Password (6 digits) *</label>
              <input
                id="password"
                type="password"
                placeholder="000000"
                value={password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPassword(value);
                }}
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password (6 digits) *</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="000000"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setConfirmPassword(value);
                }}
                maxLength={6}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(2)}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Login Link */}
        <p className="auth-link">
          Already have an account? <a href="/login">Sign in here</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
