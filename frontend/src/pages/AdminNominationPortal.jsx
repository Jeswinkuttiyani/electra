import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/NominationPortal.css";

function AdminNominationPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [currentConfig, setCurrentConfig] = useState(null);

  // Today's date in YYYY-MM-DD for min constraints
  const todayStr = new Date().toISOString().split("T")[0];

  // Minimum start date: tomorrow
  const minStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Minimum deadline: 7 days after selected start
  const minDeadline = (() => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const fetchConfig = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/election-config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cfg = res?.data?.config || {};
      setCurrentConfig(cfg);
      setStartDate(cfg.nomination_start_date || "");
      setDeadline(cfg.nomination_last_date || "");
      setNotes(cfg.notes || "");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load portal config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "admin") {
      navigate("/login");
      return;
    }
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const validate = () => {
    if (!startDate) return "Please select a Start Date.";
    if (!deadline) return "Please select a Deadline date.";
    if (startDate <= todayStr) return "Start Date must be a future date (at least tomorrow).";
    const startD = new Date(startDate);
    const deadlineD = new Date(deadline);
    const diffDays = (deadlineD - startD) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) return "Deadline must be at least 7 days after the Start Date.";
    return null;
  };

  const getPortalStatus = (cfg) => {
    if (!cfg) return "closed";
    const phase = (cfg.phase || "").toLowerCase();
    if (!phase.includes("nomination")) return "closed";
    const now = new Date();
    const start = cfg.nomination_start_date ? new Date(cfg.nomination_start_date) : null;
    const end = cfg.nomination_last_date ? new Date(cfg.nomination_last_date) : null;
    if (start && now < start) return "scheduled";
    if (end && now > end) return "expired";
    return "open";
  };

  const status = getPortalStatus(currentConfig);

  const openPortal = async () => {
    const validErr = validate();
    if (validErr) { setError(validErr); return; }
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await api.put(
        "/election-config",
        {
          phase: "nomination",
          nomination_start_date: startDate,
          nomination_last_date: deadline,
          notes: notes || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("✅ Candidate Portal has been scheduled! All voters will be notified.");
      await fetchConfig();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to open portal");
    } finally {
      setSaving(false);
    }
  };

  const closePortal = async () => {
    if (!window.confirm("Are you sure you want to close the Candidate Portal immediately?")) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await api.put(
        "/election-config",
        { phase: "closed", nomination_start_date: null, nomination_last_date: null, notes: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Portal has been closed.");
      await fetchConfig();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to close portal");
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/election-config/nomination-deadline-reminder",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res?.data?.message || "Reminder notification sent to all voters.");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to send reminder");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const statusMeta = {
    open: { label: "OPEN", color: "#16a34a", bg: "#dcfce7", icon: "🟢" },
    scheduled: { label: "SCHEDULED", color: "#d97706", bg: "#fef3c7", icon: "🟡" },
    expired: { label: "CLOSED", color: "#dc2626", bg: "#fee2e2", icon: "🔴" },
    closed: { label: "CLOSED", color: "#6b7280", bg: "#f3f4f6", icon: "⚫" },
  }[status];

  return (
    <div className="np-wrapper">
      {/* Header */}
      <header className="np-header">
        <div className="np-header-inner">
          <h1 className="np-logo">ELECTRA</h1>
          <button className="np-back-btn" onClick={() => navigate("/admin-dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="np-main">
        {/* Page Title */}
        <div className="np-page-header">
          <div>
            <h2 className="np-page-title">Candidate Portal Management</h2>
            <p className="np-page-subtitle">
              Schedule the candidate application window. The portal opens and closes automatically based on the dates you set.
            </p>
          </div>
          <div
            className="np-status-badge"
            style={{ color: statusMeta.color, background: statusMeta.bg, border: `1px solid ${statusMeta.color}33` }}
          >
            {statusMeta.icon} Portal {statusMeta.label}
          </div>
        </div>

        {/* How it works info card */}
        <div className="np-info-card">
          <div className="np-info-grid">
            <div className="np-info-item">
              <span className="np-info-icon">📅</span>
              <div>
                <div className="np-info-label">Start Date</div>
                <div className="np-info-text">Must be a future date. Portal opens automatically.</div>
              </div>
            </div>
            <div className="np-info-item">
              <span className="np-info-icon">⏰</span>
              <div>
                <div className="np-info-label">Deadline</div>
                <div className="np-info-text">Min 7 days after start. Portal closes automatically.</div>
              </div>
            </div>
            <div className="np-info-item">
              <span className="np-info-icon">🔔</span>
              <div>
                <div className="np-info-label">Notifications</div>
                <div className="np-info-text">All voters are notified instantly when portal is created.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Status Card (shown when portal is set) */}
        {currentConfig?.nomination_start_date && (
          <div className="np-current-card">
            <div className="np-current-header">
              <h3 className="np-current-title">Current Portal Schedule</h3>
              <span
                className="np-status-pill"
                style={{ color: statusMeta.color, background: statusMeta.bg }}
              >
                {statusMeta.icon} {statusMeta.label}
              </span>
            </div>
            <div className="np-current-grid">
              <div className="np-current-item">
                <div className="np-current-label">📅 Opens On</div>
                <div className="np-current-value">{formatDate(currentConfig.nomination_start_date)}</div>
              </div>
              <div className="np-current-item">
                <div className="np-current-label">🏁 Closes On</div>
                <div className="np-current-value">{formatDate(currentConfig.nomination_last_date)}</div>
              </div>
              {currentConfig.notes && (
                <div className="np-current-item np-current-item--full">
                  <div className="np-current-label">📝 Notes</div>
                  <div className="np-current-value">{currentConfig.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {error && <div className="np-alert np-alert--error">❌ {error}</div>}
        {success && <div className="np-alert np-alert--success">{success}</div>}

        {/* Configuration Form */}
        <div className="np-form-card">
          <h3 className="np-form-title">
            {status === "closed" || status === "expired" ? "Open Candidate Portal" : "Update Portal Schedule"}
          </h3>

          {loading ? (
            <div className="np-loading">
              <div className="np-spinner" />
              <span>Loading configuration...</span>
            </div>
          ) : (
            <>
              <div className="np-form-grid">
                <div className="np-field">
                  <label className="np-label" htmlFor="startDate">
                    Start Date <span className="np-required">*</span>
                    <span className="np-label-hint"> (Must be tomorrow or later)</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="np-input"
                    value={startDate}
                    min={minStart}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      // Reset deadline if it no longer satisfies the 7-day rule
                      if (deadline && e.target.value) {
                        const diff = (new Date(deadline) - new Date(e.target.value)) / (1000 * 60 * 60 * 24);
                        if (diff < 7) setDeadline("");
                      }
                      setError("");
                    }}
                  />
                </div>

                <div className="np-field">
                  <label className="np-label" htmlFor="deadline">
                    Application Deadline <span className="np-required">*</span>
                    <span className="np-label-hint"> (Min 7 days after start)</span>
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    className="np-input"
                    value={deadline}
                    min={minDeadline || minStart}
                    disabled={!startDate}
                    onChange={(e) => { setDeadline(e.target.value); setError(""); }}
                  />
                </div>

                <div className="np-field np-field--full">
                  <label className="np-label" htmlFor="notes">
                    Notes / Announcement <span className="np-label-optional">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    className="np-textarea"
                    rows={3}
                    placeholder="E.g., Only active members with 1+ year of membership are eligible to apply..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="np-actions">
                <button
                  className="np-btn np-btn--primary"
                  onClick={openPortal}
                  disabled={saving}
                >
                  {saving ? "⏳ Saving..." : "🚀 Open Candidate Portal"}
                </button>

                {(status === "open" || status === "scheduled") && (
                  <>
                    <button
                      className="np-btn np-btn--reminder"
                      onClick={sendReminder}
                      disabled={saving || status !== "open"}
                      title={status !== "open" ? "Portal must be open to send reminder" : ""}
                    >
                      🔔 Send Deadline Reminder
                    </button>
                    <button
                      className="np-btn np-btn--danger"
                      onClick={closePortal}
                      disabled={saving}
                    >
                      🔒 Close Portal Now
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Help Section */}
        <div className="np-help-card">
          <h4 className="np-help-title">📋 How the Candidate Portal Works</h4>
          <ol className="np-help-list">
            <li>Set a <strong>Start Date</strong> (any future date) and a <strong>Deadline</strong> (at least 7 days after start).</li>
            <li>Click <strong>"Open Candidate Portal"</strong> — this immediately notifies all voters via their notification bar and dashboard tile.</li>
            <li>The portal automatically <strong>opens on the start date</strong> and <strong>closes on the deadline</strong>.</li>
            <li>Use <strong>"Send Deadline Reminder"</strong> to push another notification when voting nears its end.</li>
            <li>You can <strong>"Close Portal Now"</strong> to immediately stop applications at any time.</li>
          </ol>
        </div>
      </main>

      <footer className="np-footer">
        <div className="np-footer-inner">© 2025 St. Joseph's College of Engineering &amp; Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default AdminNominationPortal;
