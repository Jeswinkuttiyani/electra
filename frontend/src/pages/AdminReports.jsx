import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [editState, setEditState] = useState({});
  const [message, setMessage] = useState("");

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/reports", { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setReports(res.data.reports || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteVoter = async (voterId) => {
    if (!confirm(`Delete voter ${voterId}? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/voter/${voterId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Voter deleted");
      fetchReports();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete voter");
    }
  };

  const openEdit = async (voterId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/voters", { headers: { Authorization: `Bearer ${token}` } });
      const voter = (res.data.voters || []).find(v => v.voter_id === voterId);
      if (voter) {
        setSelectedVoter(voter);
        setEditState({ full_name: voter.full_name, address: voter.address, email: voter.email, phone_no: voter.phone_no, branch_name: voter.branch_name });
      } else {
        setMessage("Voter not found");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch voter");
    }
  };

  const handleEditChange = (field, value) => {
    setEditState(prev => ({ ...prev, [field]: value }));
  };

  const submitEdit = async () => {
    if (!selectedVoter) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/voter/${selectedVoter.voter_id}`, editState, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setMessage("Voter updated");
        setSelectedVoter(null);
        fetchReports();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update voter");
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
          <h2 className="vd-section-title">Reported Voters</h2>
          <div className="vd-section-subtitle">Review reports submitted by voters</div>

          {message && <div style={{ marginTop: 12 }} className="message error">{message}</div>}

          <div className="voters-table-container" style={{ marginTop: 12 }}>
            {loading ? (
              <div className="no-voters">Loading reports...</div>
            ) : (
              <table className="voters-table">
                <thead>
                  <tr>
                    <th>SI No</th>
                    <th>Reported Voter ID</th>
                    <th>Reported By</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length > 0 ? reports.map((r, idx) => (
                    <Fragment key={r._id}>
                      <tr>
                        <td>{idx + 1}</td>
                        <td>{r.reported_voter_id}</td>
                        <td>{r.reporter_email}</td>
                        <td>{r.error_type}</td>
                        <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description}</td>
                        <td>{new Date(r.created_at).toLocaleString()}</td>
                        <td>
                          <button className="vd-tile-btn" style={{ padding: '6px 10px', marginRight: 8 }} onClick={() => openEdit(r.reported_voter_id)}>Edit</button>
                          <button className="btn-cancel" onClick={() => handleDeleteVoter(r.reported_voter_id)}>Delete</button>
                        </td>
                      </tr>
                    </Fragment>
                  )) : (
                    <tr>
                      <td colSpan={7} className="no-voters">No reports found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {selectedVoter && (
            <div style={{ marginTop: 20 }} className="voters-table-container">
              <div style={{ padding: 16 }}>
                <h3>Edit Voter: {selectedVoter.voter_id}</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 220 }}>
                    <label style={{ fontWeight: 600 }}>Full Name</label>
                    <input value={editState.full_name} onChange={(e) => handleEditChange('full_name', e.target.value)} />
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <label style={{ fontWeight: 600 }}>Address</label>
                    <input value={editState.address} onChange={(e) => handleEditChange('address', e.target.value)} />
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <label style={{ fontWeight: 600 }}>Email</label>
                    <input value={editState.email} onChange={(e) => handleEditChange('email', e.target.value)} />
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <label style={{ fontWeight: 600 }}>Phone</label>
                    <input value={editState.phone_no} onChange={(e) => handleEditChange('phone_no', e.target.value)} />
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <label style={{ fontWeight: 600 }}>Branch</label>
                    <input value={editState.branch_name} onChange={(e) => handleEditChange('branch_name', e.target.value)} />
                  </div>

                </div>

                <div style={{ marginTop: 12 }}>
                  <button className="vd-tile-btn" onClick={submitEdit}>Save Changes</button>
                  <button className="btn-cancel" style={{ marginLeft: 8 }} onClick={() => setSelectedVoter(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default AdminReports;
