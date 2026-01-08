import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function AdminCandidateApplications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Approved");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const backendOrigin = String(api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  const toAbsUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const normalized = url.startsWith("/") ? url.slice(1) : url;
    if (!backendOrigin) return `/${normalized}`;
    return `${backendOrigin}/${normalized}`;
  };

  const fetchApplications = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/candidate-applications", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter || undefined,
          position: positionFilter || undefined,
        },
      });
      setApplications(res.data.applications || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const userType = localStorage.getItem("userType");
    if (!storedEmail || userType !== "admin") {
      navigate("/login");
      return;
    }
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, positionFilter]);

  const positions = useMemo(() => {
    const set = new Set();
    (applications || []).forEach((a) => {
      if (a?.position) set.add(a.position);
    });
    return Array.from(set).sort();
  }, [applications]);

  const startReview = (app) => {
    setReviewingId(app?._id || "");
    setReviewStatus("Approved");
    setAdminRemarks("");
  };

  const submitReview = async () => {
    if (!reviewingId) return;
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        `/candidate-applications/${reviewingId}/review`,
        { status: reviewStatus, admin_remarks: adminRemarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res?.data?.application;
      setApplications((prev) =>
        (prev || []).map((a) => (a?._id === reviewingId ? { ...a, ...updated } : a))
      );
      setReviewingId("");
      setAdminRemarks("");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update application");
    } finally {
      setSaving(false);
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
        <h2 className="vd-section-title">Candidate Applications</h2>

        <section className="vd-notifications-list vd-card--spaced">
          <div className="filters-row">
            <div className="filter-field">
              <label className="filter-label">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="report-select">
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-field wide">
              <label className="filter-label">Position</label>
              <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="report-select">
                <option value="">All</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="filters-actions">
              <button className="vd-tile-btn" onClick={fetchApplications} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {error ? <div className="form-error">{error}</div> : null}
        </section>

        <section className="vd-notifications-list">
          {loading ? (
            <div className="empty-state">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">No applications found.</div>
          ) : (
            <div className="table-wrapper">
              <table className="voters-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Voter ID</th>
                    <th>Full Name</th>
                    <th>Branch</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Documents</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => {
                    const docs = a?.documents || {};
                    return (
                      <tr key={a._id}>
                        <td>{a.reference_number || "-"}</td>
                        <td>{a.voter_id || "-"}</td>
                        <td>{a.full_name || "-"}</td>
                        <td>{a.branch_name || "-"}</td>
                        <td>{a.position || "-"}</td>
                        <td className="status-cell">{a.status || "-"}</td>
                        <td>{a.applied_at ? new Date(a.applied_at).toLocaleString() : "-"}</td>
                        <td>
                          <div className="docs-list">
                            {docs.identity_proof ? (
                              <a className="doc-link" href={toAbsUrl(docs.identity_proof)} target="_blank" rel="noreferrer">Identity</a>
                            ) : (
                              <span>-</span>
                            )}
                            {docs.membership_proof ? (
                              <a className="doc-link" href={toAbsUrl(docs.membership_proof)} target="_blank" rel="noreferrer">Membership</a>
                            ) : (
                              <span>-</span>
                            )}
                            {docs.supporting_document ? (
                              <a className="doc-link" href={toAbsUrl(docs.supporting_document)} target="_blank" rel="noreferrer">Supporting</a>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <button className="vd-tile-btn" onClick={() => startReview(a)}>
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {reviewingId ? (
          <section className="vd-notifications-list vd-card--spaced">
            <h3 className="vd-section-title vd-section-title--compact">Review Application</h3>
            <div className="report-form">
              <div className="admin-edit-field">
                <label className="filter-label">Decision</label>
                <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="report-select">
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>

              <div className="admin-edit-field grow">
                <label className="filter-label">Admin Remarks</label>
                <input
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Optional remarks (required if rejecting, recommended)"
                  className="report-input"
                />
              </div>
            </div>

            <div className="admin-edit-actions">
              <button className="vd-tile-btn" onClick={submitReview} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="vd-tile-btn" onClick={() => setReviewingId("")} disabled={saving}>
                Cancel
              </button>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default AdminCandidateApplications;
