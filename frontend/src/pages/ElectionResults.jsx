import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AuthPages.css";

function ElectionResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/election-results", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          setResults(res.data.results || []);
        }
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="auth-container" style={{ maxWidth: "900px" }}>
      <div className="app-title">ELECTRA</div>
      
      <div className="auth-card">
        <button 
          className="btn-back" 
          onClick={() => navigate("/voter-dashboard")}
          style={{ marginBottom: "20px", padding: "10px 20px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}
        >
          ← Back
        </button>

        <h1 className="welcome-title">Election Results</h1>
        <p className="welcome-subtitle">Final voting results</p>

        {message && (
          <div className="message error">
            {message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>Loading results...</p>
          </div>
        ) : results.length > 0 ? (
          <div style={{ marginTop: "20px" }}>
            {results.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: "15px",
                  marginBottom: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9"
                }}
              >
                <h3 style={{ marginTop: 0 }}>{result.position || "Position"}</h3>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Winner: </strong> {result.winner || "TBD"}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Votes Received: </strong> {result.votes || 0}
                </div>
                <div>
                  <strong>Percentage: </strong> {result.percentage || "0"}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px" }}>
            <p>No results available yet. The election may not be concluded.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ElectionResults;
