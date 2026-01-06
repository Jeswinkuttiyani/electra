import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AuthPages.css";

function CandidateApplication() {
  const navigate = useNavigate();
  const [positionApplying, setPositionApplying] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!positionApplying || !manifesto || !experience) {
      setMessageType("error");
      setMessage("Please fill in all fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/apply-as-candidate",
        {
          position: positionApplying,
          manifesto,
          experience,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessageType("success");
      setMessage(res.data.message || "Application submitted successfully!");
      
      setTimeout(() => {
        navigate("/voter-dashboard");
      }, 2000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to submit application");
    }
  };

  return (
    <div className="auth-container">
      <div className="app-title">ELECTRA</div>
      
      <div className="auth-card">
        <button 
          className="btn-back" 
          onClick={() => navigate("/voter-dashboard")}
          style={{ marginBottom: "20px", padding: "10px 20px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}
        >
          ← Back
        </button>

        <h1 className="welcome-title">Apply as Candidate</h1>
        <p className="welcome-subtitle">Submit your candidacy application</p>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="position">Position Applying For</label>
            <select
              id="position"
              value={positionApplying}
              onChange={(e) => setPositionApplying(e.target.value)}
              required
            >
              <option value="">Select a position</option>
              <option value="president">President</option>
              <option value="vice_president">Vice President</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="class_representative">Class Representative</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manifesto">Election Manifesto</label>
            <textarea
              id="manifesto"
              placeholder="Describe your vision and policies..."
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              rows="5"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="experience">Relevant Experience</label>
            <textarea
              id="experience"
              placeholder="Share your relevant experience and achievements..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows="4"
              required
            ></textarea>
          </div>

          <button type="submit" className="auth-btn">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}

export default CandidateApplication;
