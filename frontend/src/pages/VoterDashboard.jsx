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
  const [notifications, setNotifications] = useState([]);
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
    window.location.href = "/";
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
        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default VoterDashboard;
