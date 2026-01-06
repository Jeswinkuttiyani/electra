import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AuthPages.css";

function ViewVotersList() {
  const navigate = useNavigate();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchVoters = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/voters", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setVoters(res.data.voters || []);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch voters list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  return (
    <div className="auth-container" style={{ maxWidth: "1000px" }}>
      <div className="app-title">ELECTRA</div>
      
      <div className="auth-card">
        <button 
          className="btn-back" 
          onClick={() => navigate("/voter-dashboard")}
          style={{ marginBottom: "20px", padding: "10px 20px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}
        >
          ← Back
        </button>

        <h1 className="welcome-title">Voters List</h1>
        <p className="welcome-subtitle">Complete list of eligible voters</p>

        {message && (
          <div className="message error">
            {message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>Loading voters list...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd"
            }}>
              <thead style={{ backgroundColor: "#f4f4f4" }}>
                <tr>
                  <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>SI No</th>
                  <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Voter ID</th>
                  <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Voter Name</th>
                  <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Address</th>
                </tr>
              </thead>
              <tbody>
                {voters.length > 0 ? (
                  voters.map((voter, idx) => (
                    <tr key={voter.voter_id}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{idx + 1}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{voter.voter_id}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{voter.full_name || voter.name}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{voter.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: "20px", textAlign: "center" }}>
                      No voters found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewVotersList;
