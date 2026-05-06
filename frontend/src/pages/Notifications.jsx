import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const dismissedIds = useMemo(() => {
    try {
      const raw = localStorage.getItem("dismissedNotificationIds");
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }, []);

  const [dismissed, setDismissed] = useState(dismissedIds);

  const saveDismissed = (next) => {
    setDismissed(next);
    localStorage.setItem("dismissedNotificationIds", JSON.stringify(Array.from(next)));
  };

  const dismiss = (id) => {
    const next = new Set(dismissed);
    next.add(String(id));
    saveDismissed(next);
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      } else {
        setMessage(res.data.message || "Failed to fetch notifications");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const visibleNotifications = useMemo(() => {
    return (notifications || []).filter((n) => !dismissed.has(String(n._id)));
  }, [notifications, dismissed]);

  return (
    <div className="vd-wrapper">
      <header className="vd-header">
        <div className="vd-header-inner">
          <h1 className="vd-website-name">ELECTRA</h1>
          <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>Back</button>
        </div>
      </header>

      <main className="vd-main">
        <section>
          <h2 className="vd-section-title">Notifications</h2>
          <div className="vd-section-subtitle">All announcements sent by the admin</div>

          {message && <div style={{ marginTop: 12 }} className="message error">{message}</div>}

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 50, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', color: '#64748b' }}>
                <div style={{ fontSize: '24px', marginBottom: 12 }}>⏳</div>
                Loading your notifications...
              </div>
            ) : visibleNotifications.length > 0 ? (
              visibleNotifications.map((n) => (
                <div key={n._id} className="voters-table-container" style={{
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  position: 'relative',
                  borderLeft: '4px solid #2563eb',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0
                  }}>
                    📢
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0b2340', fontWeight: 800 }}>
                        {n.title || "Announcement"}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ""}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' }}>
                      {n.message}
                    </p>
                  </div>

                  <button
                    onClick={() => dismiss(n._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      marginLeft: 12,
                      transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#94a3b8'}
                    onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px dashed #e2e8f0', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>All caught up!</div>
                <div style={{ marginTop: 4 }}>No new notifications to show.</div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default Notifications;
