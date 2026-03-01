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

  const handleLinkWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to link your wallet!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];

      const token = localStorage.getItem("token");
      const res = await api.post("/auth/metamask/link",
        { address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setWalletAddress(address);
        localStorage.setItem("walletAddress", address);
        alert("Success! Your MetaMask wallet has been linked to your Electra account.");
      } else {
        alert(res.data.message || "Failed to link wallet");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Link failed");
    }
  };
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
                <span className="profile-label">Wallet ID:</span>
                <span className="profile-value">
                  {walletAddress ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="wallet-badge">
                        ✅ {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </span>
                      <button
                        className="vd-tile-btn"
                        style={{ padding: "2px 8px", fontSize: 10, background: "none", border: "1px solid #ccc", color: "#666" }}
                        onClick={handleLinkWallet}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button className="vd-tile-btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={handleLinkWallet}>
                      Link MetaMask Wallet
                    </button>
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
        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default VoterDashboard;
