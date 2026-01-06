import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function ReportVoterError() {
  const navigate = useNavigate();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeReportId, setActiveReportId] = useState(null);
  const [reportState, setReportState] = useState({});

  const fetchVoters = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/voters", { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setVoters(res.data.voters || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch voters list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  const openReport = (id, voterId) => {
    setActiveReportId(id);
    setReportState(prev => ({
      ...prev,
      [id]: { errorType: "", description: "", voter_id: voterId }
    }));
  };

  const closeReport = (id) => {
    setActiveReportId(null);
  };

  const handleReportChange = (id, field, value) => {
    setReportState(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  };

  const submitReport = async (id) => {
    const data = reportState[id];
    if (!data || !data.errorType || (!data.description && data.errorType === 'other')) {
      setMessage("Please select an error type and provide description if 'Other'.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/report-voter-error",
        {
          voter_id: data.voter_id,
          error_type: data.errorType,
          description: data.description || data.errorType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Report submitted successfully.");
      closeReport(id);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to submit report");
    }
  };

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
          <h2 className="vd-section-title">Report Voter Error</h2>
          <div className="vd-section-subtitle">Flag any suspicious or unusual voters in the list</div>

          {message && <div style={{ marginTop: 12 }} className="message error">{message}</div>}

          <div className="voters-table-container">
            {loading ? (
              <div className="no-voters">Loading voters list...</div>
            ) : (
              <table className="voters-table">
                <thead>
                  <tr>
                    <th>SI No</th>
                    <th>Voter ID</th>
                    <th>Voter Name</th>
                    <th>Address</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.length > 0 ? voters.map((voter, idx) => (
                    <Fragment key={voter._id || voter.voter_id}>
                      <tr>
                        <td>{idx + 1}</td>
                        <td>{voter.voter_id}</td>
                        <td>{voter.full_name || voter.name}</td>
                        <td>{voter.address}</td>
                        <td>
                          <button className="vd-tile-btn" style={{ padding: '6px 12px', maxWidth: 120 }} onClick={() => openReport(voter._id || voter.voter_id, voter.voter_id)}>
                            Report
                          </button>
                        </td>
                      </tr>

                      {activeReportId === (voter._id || voter.voter_id) && (
                        <tr>
                          <td colSpan="5">
                            <div style={{ padding: 12, background: '#fff' }}>
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="report-form">
                                  <div className="report-field">
                                    <label>Reason</label>
                                    <select className="report-select" value={reportState[activeReportId]?.errorType || ''} onChange={(e) => handleReportChange(activeReportId, 'errorType', e.target.value)}>
                                      <option value="">Select reason</option>
                                      <option value="fake_voter">Fake Voter</option>
                                      <option value="fake_address">Fake Address</option>
                                      <option value="duplicate">Duplicate</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>

                                  <div className="report-field report-field--grow">
                                    <label>Description (optional)</label>
                                    <input className="report-input" type="text" placeholder="Optional details or required if 'Other'" value={reportState[activeReportId]?.description || ''} onChange={(e) => handleReportChange(activeReportId, 'description', e.target.value)} />
                                  </div>

                                  <div className="report-actions">
                                    <button className="vd-tile-btn" onClick={() => submitReport(activeReportId)}>Submit</button>
                                    <button className="btn-cancel" onClick={() => closeReport(activeReportId)}>Cancel</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )) : (
                    <tr>
                      <td colSpan="5" className="no-voters">No voters found</td>
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

export default ReportVoterError;
