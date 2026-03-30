import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function VoterDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [voterId, setVoterId] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [address, setAddress] = useState("");
  const [branchName, setBranchName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [notifications, setNotifications] = useState([]);
  
  // PIN Reset State
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Wallet linking is now managed by the backend.
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => {
    try {
      const raw = localStorage.getItem("dismissedNotificationIds");
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  });

  const backendOrigin = String(api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  const getPhotoSrc = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const normalized = url.startsWith("/") ? url.slice(1) : url;
    if (!backendOrigin) return `/${normalized}`;
    return `${backendOrigin}/${normalized}`;
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      // If endpoint doesn't exist yet, use empty array
      setNotifications([]);
    }
  };

  const dismissNotification = (id) => {
    const next = new Set(dismissedNotificationIds);
    next.add(String(id));
    setDismissedNotificationIds(next);
    localStorage.setItem("dismissedNotificationIds", JSON.stringify(Array.from(next)));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userType = localStorage.getItem("userType");
        if (!token || userType !== "voter") {
          navigate("/login");
          return;
        }

        const res = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const p = res.data;
          setEmail(p.email || "");
          setName(p.name || "");
          setFullName(p.full_name || "");
          setVoterId(p.voter_id || "");
          setDob(p.date_of_birth || p.dob || "");
          setPhoneNo(p.phone_no || "");
          setAddress(p.address || "");
          setBranchName(p.branch_name || "");
          setPhotoUrl(p.photo_url || "");
          setWalletAddress(p.walletAddress || "");

          // Update local storage to keep it in sync
          localStorage.setItem("email", p.email || "");
          localStorage.setItem("voterId", p.voter_id || "");
          localStorage.setItem("walletAddress", p.walletAddress || "");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchProfile();
    fetchNotifications();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear(); // Clear EVERYTHING to prevent session leaks
    window.location.href = "/";
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    
    if (currentPin.length !== 6 || newPin.length !== 6 || confirmNewPin.length !== 6) {
      setResetError("All PIN fields must be exactly 6 digits.");
      return;
    }
    
    if (newPin !== confirmNewPin) {
      setResetError("New PIN and Confirm PIN do not match.");
      return;
    }
    
    setIsResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/voting-pin/reset", {
        current_pin: currentPin,
        new_pin: newPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setResetSuccess("Your voting PIN has been successfully reset.");
        setCurrentPin("");
        setNewPin("");
        setConfirmNewPin("");
        
        // Auto close after 3 seconds
        setTimeout(() => {
          setShowResetPinModal(false);
          setResetSuccess("");
        }, 3000);
      } else {
        setResetError(res.data.message || "Failed to reset PIN.");
      }
    } catch (err) {
      setResetError(err.response?.data?.message || "Error connecting to server. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="vd-wrapper">
      {/* Website Name Header */}
      <header className="vd-header">
        <div className="vd-header-inner">
          <h1 className="vd-website-name">ELECTRA</h1>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="vd-main">
        {(() => {
          const latest = (notifications || []).find((n) => !dismissedNotificationIds.has(String(n._id)));
          if (!latest) return null;

          return (
            <section className="notif-banner">
              <div className="notif-banner-left">
                <div className="notif-banner-title">{latest.title || "Notification"}</div>
                <div className="notif-banner-message">{latest.message}</div>
                {latest.created_at && (
                  <div className="notif-banner-date">{new Date(latest.created_at).toLocaleString()}</div>
                )}
              </div>

              <div className="notif-banner-actions">
                <button className="vd-tile-btn" type="button" style={{ maxWidth: 160 }} onClick={() => navigate("/notifications")}>View all</button>
                <button className="notif-dismiss" type="button" onClick={() => dismissNotification(latest._id)}>×</button>
              </div>
            </section>
          );
        })()}

        {/* User Profile Tile */}
        <section className="vd-profile-tile">
          <h2 className="vd-section-title">My Profile</h2>
          <div className="vd-profile-card">
            <div className="profile-avatar">👤</div>
            <div className="profile-details">
              <div className="profile-row">
                <span className="profile-label">Voter ID:</span>
                <span className="profile-value">{voterId || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Full Name:</span>
                <span className="profile-value">{fullName || name || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Email ID:</span>
                <span className="profile-value">{email || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Phone Number:</span>
                <span className="profile-value">{phoneNo || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Date of Birth:</span>
                <span className="profile-value">{dob || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Address:</span>
                <span className="profile-value">{address || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Branch Name:</span>
                <span className="profile-value">{branchName || "—"}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Blockchain ID:</span>
                <span className="profile-value">
                  {walletAddress ? (
                    <span className="wallet-badge">
                      ✅ {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  ) : (
                    <span style={{ opacity: 0.6, fontSize: 13 }}>Assigned automatically upon voting</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Tiles */}
        <section className="vd-action-tiles">
          <div className="vd-tile vd-tile--highlight">
            <div className="vd-tile-icon">🗳️</div>
            <h3 className="vd-tile-title">Cast Your Vote</h3>
            <p className="vd-tile-desc">Securely cast your vote on the blockchain. Each voter gets exactly one vote.</p>
            <button className="vd-tile-btn vd-tile-btn--primary" onClick={() => navigate("/vote")}>
              Vote Now
            </button>
          </div>

          <div className="vd-tile">
            <div className="vd-tile-icon">📋</div>
            <h3 className="vd-tile-title">View Voters List</h3>
            <p className="vd-tile-desc">See the complete list of all eligible voters for the election.</p>
            <button className="vd-tile-btn" onClick={() => navigate("/voters-list")}>
              View List
            </button>
          </div>

          <div className="vd-tile">
            <div className="vd-tile-icon">🔔</div>
            <h3 className="vd-tile-title">Notifications</h3>
            <p className="vd-tile-desc">View all announcements sent by the admin and clear them once read.</p>
            <button className="vd-tile-btn" onClick={() => navigate("/notifications")}>
              View Notifications
            </button>
          </div>

          <div className="vd-tile">
            <div className="vd-tile-icon">🚩</div>
            <h3 className="vd-tile-title">Flag Unusual Voters</h3>
            <p className="vd-tile-desc">Review and flag any suspicious or unusual voters in the list.</p>
            <button className="vd-tile-btn" onClick={() => navigate("/report-voter-error")}>
              Check & Flag
            </button>
          </div>

          <div className="vd-tile">
            <div className="vd-tile-icon">🎯</div>
            <h3 className="vd-tile-title">Apply as Candidate</h3>
            <p className="vd-tile-desc">Submit your application to become a candidate in the election.</p>
            <button className="vd-tile-btn" onClick={() => navigate("/candidate-application")}>
              Apply Now
            </button>
          </div>

          <div className="vd-tile">
            <div className="vd-tile-icon">📊</div>
            <h3 className="vd-tile-title">Election Results</h3>
            <p className="vd-tile-desc">View the published results once voting is complete.</p>
            <button className="vd-tile-btn" onClick={() => navigate("/election-results")}>
              View Results
            </button>
          </div>

          <div className="vd-tile">
            <div className="vd-tile-icon">🔑</div>
            <h3 className="vd-tile-title">Reset Voting PIN</h3>
            <p className="vd-tile-desc">Safely change your 6-digit voting PIN used to encrypt your blockchain digital signature.</p>
            <button className="vd-tile-btn" onClick={() => {
              setShowResetPinModal(true);
              setResetError("");
              setResetSuccess("");
              setCurrentPin("");
              setNewPin("");
              setConfirmNewPin("");
            }}>
              Reset PIN
            </button>
          </div>
        </section>
        {/* Reset PIN Modal */}
        {showResetPinModal && (
          <div className="pin-modal-overlay">
            <div className="pin-modal-content">
              <h3>Reset Voting PIN</h3>
              <p className="pin-modal-desc">Please enter your current PIN and your new 6-digit PIN below.</p>
              
              {resetError && <div className="pin-error-msg">{resetError}</div>}
              {resetSuccess && <div className="pin-success-msg">{resetSuccess}</div>}
              
              <form onSubmit={handleResetPin} className="pin-reset-form">
                <div className="pin-input-group">
                  <label>Current PIN</label>
                  <input 
                    type="password" 
                    maxLength="6" 
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter current 6-digit PIN"
                    disabled={isResetting || !!resetSuccess}
                    required
                  />
                </div>
                
                <div className="pin-input-group">
                  <label>New PIN</label>
                  <input 
                    type="password" 
                    maxLength="6" 
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter new 6-digit PIN"
                    disabled={isResetting || !!resetSuccess}
                    required
                  />
                </div>
                
                <div className="pin-input-group">
                  <label>Confirm New PIN</label>
                  <input 
                    type="password" 
                    maxLength="6" 
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Re-enter new 6-digit PIN"
                    disabled={isResetting || !!resetSuccess}
                    required
                  />
                </div>
                
                <div className="pin-modal-actions">
                  {!resetSuccess ? (
                    <>
                      <button type="button" className="btn-cancel" onClick={() => setShowResetPinModal(false)} disabled={isResetting}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-submit" disabled={isResetting}>
                        {isResetting ? "Resetting..." : "Reset PIN"}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn-submit" onClick={() => setShowResetPinModal(false)}>
                      Close
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default VoterDashboard;
