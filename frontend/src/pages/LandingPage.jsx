import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  const [electionStatus, setElectionStatus] = useState("scheduled");
  const [notifications, setNotifications] = useState([
    { type: "info", title: "Draft Voters List Published", date: "20 Dec 2025" },
    { type: "warning", title: "Objection Window: 22 Dec - 28 Dec 2025", date: "Active" },
    { type: "success", title: "Final Voters List Ready", date: "29 Dec 2025" },
  ]);

  const electionTimeline = [
    { status: "completed", label: "Draft Voters List", date: "15 Dec" },
    { status: "active", label: "Objection Window", date: "22-28 Dec" },
    { status: "upcoming", label: "Final Voters List", date: "29 Dec" },
    { status: "upcoming", label: "Election Scheduled", date: "12 Oct 2025" },
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏛️</div>
            <div className="logo-text">
              <h1>Electra</h1>
              <p>Smart Election Assistant</p>
            </div>
          </div>
          <div className="header-buttons">
            <button className="btn btn-header" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="btn btn-header secondary" onClick={() => navigate("/signup")}>
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        {/* Purpose Section */}
        <section className="purpose-section">
          <div className="purpose-content">
            <h2>Entry Point & Transparency Portal</h2>
            <p className="purpose-desc">
              Secure bank election system designed for transparent, secure, and efficient voting
            </p>
          </div>
        </section>

        {/* Project Overview */}
        <section className="overview-section">
          <div className="section-container">
            <h3 className="section-title">Project Overview</h3>
            <div className="overview-grid">
              <div className="overview-card">
                <div className="card-icon">🔐</div>
                <h4>Secure Voting</h4>
                <p>End-to-end encrypted voting system with biometric verification</p>
              </div>
              <div className="overview-card">
                <div className="card-icon">📋</div>
                <h4>Voter Management</h4>
                <p>Comprehensive voters list with multi-stage publication process</p>
              </div>
              <div className="overview-card">
                <div className="card-icon">👁️</div>
                <h4>Full Transparency</h4>
                <p>Public access to election timelines and verification status</p>
              </div>
              <div className="overview-card">
                <div className="card-icon">⚡</div>
                <h4>Real-Time Updates</h4>
                <p>Live election status tracking and result publication</p>
              </div>
            </div>
          </div>
        </section>

        {/* Election Lifecycle Indicator */}
        <section className="lifecycle-section">
          <div className="section-container">
            <h3 className="section-title">Election Lifecycle</h3>
            <div className="timeline">
              {electionTimeline.map((item, index) => (
                <div key={index} className={`timeline-item ${item.status}`}>
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <p className="timeline-label">{item.label}</p>
                    <p className="timeline-date">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation Section */}
        <section className="navigation-section">
          <div className="section-container">
            <h3 className="section-title">Access Election Information</h3>
            <div className="nav-buttons-grid">
              <button className="nav-button" onClick={() => navigate("/login")}>
                <span className="nav-icon">🔓</span>
                <span className="nav-label">Login</span>
                <span className="nav-desc">Voter or Admin access</span>
              </button>
              <button className="nav-button" onClick={() => alert("View Draft Voters List")}>
                <span className="nav-icon">📄</span>
                <span className="nav-label">Draft Voters List</span>
                <span className="nav-desc">Public list for objections</span>
              </button>
              <button className="nav-button" onClick={() => alert("View Final Voters List")}>
                <span className="nav-icon">✅</span>
                <span className="nav-label">Final Voters List</span>
                <span className="nav-desc">Verified eligible voters</span>
              </button>
              <button className="nav-button" onClick={() => alert("View Results")}>
                <span className="nav-icon">📊</span>
                <span className="nav-label">Election Results</span>
                <span className="nav-desc">Published results & analysis</span>
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="notifications-section">
          <div className="section-container">
            <div className="notifications-header">
              <h3 className="section-title">Public Notices & Notifications</h3>
              <a href="#" className="view-all">View All Notifications →</a>
            </div>
            <div className="notifications-list">
              {notifications.map((notif, index) => (
                <div key={index} className={`notification-item ${notif.type}`}>
                  <div className="notif-icon">
                    {notif.type === "success" && "✓"}
                    {notif.type === "warning" && "⚠"}
                    {notif.type === "info" && "ℹ"}
                  </div>
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important Dates */}
        <section className="important-dates-section">
          <div className="section-container">
            <h3 className="section-title">Important Dates</h3>
            <div className="dates-grid">
              <div className="date-card">
                <p className="date-label">Objection Deadline</p>
                <p className="date-value">28 Dec 2025</p>
              </div>
              <div className="date-card">
                <p className="date-label">Nomination Dates</p>
                <p className="date-value">15 - 20 Oct 2025</p>
              </div>
              <div className="date-card">
                <p className="date-label">Election Date</p>
                <p className="date-value">12 Oct 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="section-container">
            <h3>Ready to Participate?</h3>
            <p>Sign in to access your voting dashboard or view election information</p>
            <div className="cta-buttons">
              <button className="btn btn-primary-large" onClick={() => navigate("/login")}>
                Login to Your Account
              </button>
              <button className="btn btn-secondary-large" onClick={() => navigate("/signup")}>
                Create New Account
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
