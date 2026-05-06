import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function SendNotification() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [editId, setEditId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useState(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!message.trim()) {
      setStatus("⚠️ Please enter a message");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let res;

      if (editId) {
        // Update existing
        res = await api.put(
          `/notifications/${editId}`,
          { title: title || "Important Update", message },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new
        res = await api.post(
          "/notifications",
          { title: title || "Important Update", message },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (res.data.success) {
        setStatus(editId ? "✅ Notification updated successfully" : "✅ Notification sent successfully");
        setTitle("");
        setMessage("");
        setEditId(null);
        fetchHistory();
      } else {
        setStatus("❌ " + (res.data.message || "Operation failed"));
      }
    } catch (err) {
      setStatus("❌ " + (err.response?.data?.message || "Operation failed"));
    }
  };

  const handleEdit = (n) => {
    setEditId(n._id);
    setTitle(n.title);
    setMessage(n.message);
    setStatus("📝 Editing notification...");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setMessage("");
    setStatus("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification? It will be removed for all users. This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete(`/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setStatus("✅ Notification deleted");
        fetchHistory();
      }
    } catch (err) {
      setStatus("❌ " + (err.response?.data?.message || "Failed to delete"));
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

          <div className="voters-table-container" style={{ marginTop: 24, padding: 24 }}>
            <h3 style={{ marginBottom: 20, color: '#0b2340', fontSize: '1.25rem' }}>
              {editId ? "📝 Modify Announcement" : "📢 Send New Announcement"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#4b5563' }}>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Election Update"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem',
                    background: '#f8fafc',
                    color: '#1e293b',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#4b5563' }}>Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Write your announcement clearly and concisely..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: '1rem',
                    background: '#f8fafc',
                    color: '#1e293b',
                    resize: 'vertical',
                    lineHeight: '1.5'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="vd-tile-btn"
                  type="submit"
                  style={{ background: editId ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #2563eb, #1e40af)', padding: '12px 24px', flex: 1 }}
                >
                  {editId ? "Update Announcement" : "Post Announcement"}
                </button>
                {editId && (
                  <button
                    className="btn-cancel"
                    type="button"
                    onClick={cancelEdit}
                    style={{ padding: '12px 24px' }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  className="btn-cancel"
                  type="button"
                  onClick={() => navigate('/admin-dashboard')}
                  style={{ padding: '12px 24px' }}
                >
                  {editId ? "Back to Dashboard" : "Cancel"}
                </button>
              </div>
            </form>
          </div>

          <div className="voters-table-container" style={{ marginTop: 32 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ color: '#0b2340', margin: 0 }}>Sent History</h3>
              <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Manage and track your previous announcements</div>
            </div>

            {loadingHistory ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading history...</div>
            ) : (
              <table className="voters-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Title</th>
                    <th>Message Content</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.length > 0 ? notifications.map((n) => (
                    <tr key={n._id}>
                      <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{n.title}</td>
                      <td style={{ maxWidth: 400 }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.9rem',
                          color: '#475569'
                        }}>
                          {n.message}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEdit(n)}
                            className="vd-tile-btn"
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8rem',
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #e2e8f0',
                              boxShadow: 'none'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(n._id)}
                            className="btn-cancel"
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8rem',
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #ef4444'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                        No notifications sent yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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

export default SendNotification;
