import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

const backendOrigin = String(api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");

const API = (path, opts = {}) => {
  const token = localStorage.getItem("token");
  return api({ url: path, headers: { Authorization: `Bearer ${token}` }, ...opts });
};

function VoteBar({ value, max, color = "#1e3c72" }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, background: "#e5eaf2", borderRadius: 8, height: 18, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, #2a5298)`,
            height: "100%",
            borderRadius: 8,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ minWidth: 42, fontWeight: 700, color, fontSize: 13 }}>{pct}%</span>
    </div>
  );
}

export default function ElectionResults() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    try {
      const res = await API("/blockchain/results");
      if (res.data.success) {
        setData(res.data);
        setError("");
      } else {
        setError(res.data.message || "Failed to load results");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    // Auto-refresh every 10 seconds if voting is open
    const t = setInterval(fetchResults, 10000);
    return () => clearInterval(t);
  }, [fetchResults]);

  const votingOpen = data?.voting_open;
  const totalVotes = data?.total_votes ?? 0;
  const positions = data?.results_by_position ?? [];
  const allCandidates = data?.all_candidates ?? [];

  return (
    <div className="vd-wrapper">
      <header className="vd-header">
        <div className="vd-header-inner">
          <h1 className="vd-website-name">ELECTRA</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {data !== null && (
              votingOpen
                ? <span className="bc-badge bc-badge--open">🟢 Voting In Progress</span>
                : totalVotes > 0
                  ? <span className="bc-badge bc-badge--closed">🏁 Election Concluded</span>
                  : <span className="bc-badge bc-badge--warn">⏳ Not Started</span>
            )}
            <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>← Dashboard</button>
          </div>
        </div>
      </header>

      <main className="vd-main">
        <section>
          <h2 className="vd-section-title">📊 Election Results</h2>
          <div className="vd-section-subtitle">
            {votingOpen
              ? "Voting is currently in progress. Live tallies are hidden to maintain integrity."
              : totalVotes > 0
                ? "Final results from the blockchain."
                : "No votes have been recorded yet."}
          </div>

          {loading && <div className="bc-spinner" style={{ marginTop: 40 }}>Loading results from blockchain…</div>}
          {error && <div className="bc-flash bc-flash--error">{error}</div>}

          {!loading && !error && data === null && (
            <div className="vote-closed-card">
              <div style={{ fontSize: 48 }}>🔒</div>
              <h3>Voting has not started</h3>
              <p>Results will appear here once the election begins.</p>
            </div>
          )}

          {!loading && data !== null && (
            <>
              {/* ── Summary Stats ──────────────────────────────────── */}
              <div className="bc-info-grid" style={{ marginTop: 20, marginBottom: 8 }}>
                <div className="bc-info-item">
                  <span className="bc-info-label">Total Votes</span>
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{votingOpen ? "—" : totalVotes}</span>
                </div>
                <div className="bc-info-item">
                  <span className="bc-info-label">Candidates</span>
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{data.candidate_count ?? 0}</span>
                </div>
                <div className="bc-info-item">
                  <span className="bc-info-label">Status</span>
                  <span style={{ fontWeight: 700 }}>{votingOpen ? "In Progress" : totalVotes > 0 ? "Concluded" : "Not Started"}</span>
                </div>
              </div>

              {/* ── Results by Position ────────────────────────────── */}
              {votingOpen ? (
                <div className="vote-closed-card" style={{ marginTop: 40, background: "rgba(30, 60, 114, 0.05)", border: "1px dashed #1e3c72" }}>
                  <div style={{ fontSize: 48 }}>📊</div>
                  <h3>Voting is in Progress</h3>
                  <p>Live results are hidden to ensure election integrity. Final tallies will be visible here once the polls close.</p>
                </div>
              ) : (
                positions.map((pos) => (
                  <div key={pos.position} className="bc-card" style={{ marginTop: 20 }}>
                    <div className="bc-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{pos.position}</span>
                      {!votingOpen && totalVotes > 0 && (() => {
                        const topCands = (pos.candidates || []);
                        const isTie = pos.is_tie || (topCands.length > 1 && topCands[0].vote_count === topCands[1].vote_count && topCands[0].vote_count > 0);

                        if (isTie) {
                          return (
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#6c757d", background: "#f8f9fa", padding: "4px 12px", borderRadius: 20, border: "1px solid #dee2e6" }}>
                              ⚖️ Election Tied
                            </span>
                          );
                        } else if (pos.winner) {
                          return (
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e7e34", background: "#e6f4ea", padding: "4px 12px", borderRadius: 20, border: "1px solid #c3e6cb" }}>
                              🏆 Winner: {pos.winner.name}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {(pos.candidates || []).map((c, idx) => {
                        const topCands = (pos.candidates || []);
                        const isTie = pos.is_tie || (topCands.length > 1 && topCands[0].vote_count === topCands[1].vote_count && topCands[0].vote_count > 0);
                        const isWinner = !votingOpen && !isTie && pos.winner && c.id === pos.winner.id;
                        const photoSrc = c.candidate_photo_url
                          ? `${backendOrigin}${c.candidate_photo_url}`
                          : null;

                        return (
                          <div
                            key={c.id}
                            className={`results-candidate-row ${isWinner ? "results-candidate-row--winner" : ""}`}
                          >
                            <div className="results-cand-avatar">
                              {photoSrc
                                ? <img src={photoSrc} alt={c.name} onError={e => { e.target.style.display = "none"; }} />
                                : <span>{isWinner ? "🏆" : "👤"}</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <strong style={{ fontSize: 15 }}>{c.name}</strong>
                                <span style={{ fontWeight: 700, color: "#1e3c72" }}>
                                  {c.vote_count} vote{c.vote_count !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <VoteBar value={c.vote_count} max={Math.max(totalVotes, 1)} color={isWinner ? "#1e7e34" : "#1e3c72"} />
                              {c.branch_name && (
                                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{c.branch_name}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {positions.length === 0 && !loading && (
                <div className="vote-closed-card" style={{ marginTop: 24 }}>
                  <p>No candidates on the blockchain yet.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="vd-footer">
        <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
      </footer>
    </div>
  );
}
