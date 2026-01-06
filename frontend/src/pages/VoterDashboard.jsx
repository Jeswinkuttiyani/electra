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
  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedName = localStorage.getItem("name");
    const storedFullName = localStorage.getItem("fullName");
    const storedVoterId = localStorage.getItem("voterId");
    const storedDob = localStorage.getItem("dob");
    const storedPhoneNo = localStorage.getItem("phoneNo");
    const storedAddress = localStorage.getItem("address");
    const storedBranchName = localStorage.getItem("branchName");
    const storedPhotoUrl = localStorage.getItem("photoUrl");
    const userType = localStorage.getItem("userType");

    if (!storedEmail || userType !== "voter") {
      navigate("/login");
      return;
    }

    setEmail(storedEmail);
    setName(storedName || "");
    setFullName(storedFullName || "");
    setVoterId(storedVoterId || "");
    setDob(storedDob || "");
    setPhoneNo(storedPhoneNo || "");
    setAddress(storedAddress || "");
    setBranchName(storedBranchName || "");
    setPhotoUrl(storedPhotoUrl || "");

    // Fetch notifications from admin
    fetchNotifications();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("name");
    localStorage.removeItem("fullName");
    localStorage.removeItem("voterId");
    localStorage.removeItem("email");
    localStorage.removeItem("dob");
    localStorage.removeItem("phoneNo");
    localStorage.removeItem("address");
    localStorage.removeItem("branchName");
    localStorage.removeItem("photoUrl");
    navigate("/login");
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
        {/* Notifications Section */}
        {notifications.length > 0 && (
          <section className="vd-notifications">
            <h2 className="vd-section-title">Notifications</h2>
            <div className="vd-notifications-list">
              {notifications.map((notif, index) => (
                <div key={index} className="vd-notification-item">
                  <span className="notif-icon">📢</span>
                  <span className="notif-text">{notif.message}</span>
                  <span className="notif-date">{new Date(notif.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* User Profile Tile */}
        <section className="vd-profile-tile">
          <h2 className="vd-section-title">My Profile</h2>
          <div className="vd-profile-card">
            {photoUrl ? (
              <div className="profile-avatar">
                <img src={photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              </div>
            ) : (
              <div className="profile-avatar">👤</div>
            )}
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
            </div>
          </div>
        </section>

        {/* Action Tiles - 2x2 Grid */}
        <section className="vd-action-tiles">
          <div className="vd-tile">
            <div className="vd-tile-icon">📋</div>
            <h3 className="vd-tile-title">View Voters List</h3>
            <p className="vd-tile-desc">See the complete list of all eligible voters for the election.</p>
            <button className="vd-tile-btn" onClick={() => navigate("/voters-list")}>
              View List
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
        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default VoterDashboard;
