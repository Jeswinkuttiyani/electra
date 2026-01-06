import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function SendNotification() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!message.trim()) {
      setStatus("Please enter a message");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/notifications",
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setStatus("Notification sent");
        setMessage("");
        setTimeout(() => navigate("/admin-dashboard"), 900);
      } else {
        setStatus(res.data.message || "Failed to send notification");
      }
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to send notification");
    }
  };

  return (
    <div className="vd-wrapper">
      <header className="vd-header">
        <div className="vd-header-inner">
          <h1 className="vd-website-name">ELECTRA</h1>
          <button className="btn-logout" onClick={() => navigate("/admin-dashboard")}>Back</button>
        </div>
      </header>

      <main className="vd-main">
        <section>
          <h2 className="vd-section-title">Send Notification</h2>
          <div className="vd-section-subtitle">Send an announcement to all voters</div>

          {status && <div style={{ marginTop: 12 }} className="message">{status}</div>}

          <div className="admin-edit-card" style={{ marginTop: 16 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e6eef7' }} />
              </div>

              <div className="admin-edit-actions">
                <button className="vd-tile-btn" type="submit">Send</button>
                <button className="btn-cancel" type="button" onClick={() => navigate('/admin-dashboard')} style={{ marginLeft: 8 }}>Cancel</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default SendNotification;
