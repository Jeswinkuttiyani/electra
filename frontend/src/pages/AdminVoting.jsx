import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

const API = (path, opts = {}) => {
  const token = localStorage.getItem("token");
  return api({ url: path, headers: { Authorization: `Bearer ${token}` }, ...opts });
};

function StatusBadge({ votingOpen, contractDeployed, ganacheConnected }) {
  if (!ganacheConnected)
    return <span className="bc-badge bc-badge--error">🔴 Ganache Offline</span>;
  if (!contractDeployed)
    return <span className="bc-badge bc-badge--warn">⚠️ No Contract</span>;
  if (votingOpen)
    return <span className="bc-badge bc-badge--open">🟢 Voting Open</span>;
  return <span className="bc-badge bc-badge--closed">🔴 Voting Closed</span>;
}

function ProgressBar({ value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bc-bar-wrap">
      <div className="bc-bar-fill" style={{ width: `${pct}%` }} />
      <span className="bc-bar-label">{pct}%</span>
    </div>
  );
}

export default function AdminVoting() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type: 'success'|'error', text: ''}
  const [txLog, setTxLog] = useState([]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 6000);
  };

  const logTx = (label, hash) => {
    setTxLog(prev => [{ label, hash, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        API("/blockchain/status"),
        API("/blockchain/candidates"),
      ]);
      if (sRes.data.success) setStatus(sRes.data);
      if (cRes.data.success) setCandidates(cRes.data.candidates || []);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 8000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const doAction = async (action, label) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await API(`/blockchain/${action}`, { method: "post", data: {} });
      if (res.data.success) {
        flash("success", res.data.message);
        if (res.data.tx_hash) logTx(label, res.data.tx_hash);
        if (res.data.contract_address) logTx("Deploy", res.data.contract_address);
        await fetchAll();
      } else {
        flash("error", res.data.message || "Action failed");
      }
    } catch (e) {
      flash("error", e.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const totalVotes = status?.total_votes || 0;

  return (
    <div className="vd-wrapper">
      <header className="vd-header">
        <div className="vd-header-inner">
          <h1 className="vd-website-name">ELECTRA</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {status && <StatusBadge {...status} />}
            <button className="btn-logout" onClick={() => navigate("/admin-dashboard")}>← Back</button>
          </div>
        </div>
      </header>

      <main className="vd-main">
        <section>
          <h2 className="vd-section-title">⛓️ Blockchain Voting Management</h2>
          <div className="vd-section-subtitle">
            Ganache-powered immutable voting — deploy, manage candidates, and control the election.
          </div>

          {/* Flash Message */}
          {msg && (
            <div className={`bc-flash bc-flash--${msg.type}`}>{msg.text}</div>
          )}

          {loading ? (
            <div className="bc-spinner">Loading blockchain status…</div>
          ) : (
            <>
              {/* ── Status Card ─────────────────────────────────────── */}
              <div className="bc-card" style={{ marginTop: 20 }}>
                <div className="bc-card-title">📡 Network Status</div>
                <div className="bc-info-grid">
                  <div className="bc-info-item">
                    <span className="bc-info-label">Ganache</span>
                    <span>{status?.ganache_connected ? "🟢 Connected" : "🔴 Offline"}</span>
                  </div>
                  <div className="bc-info-item">
                    <span className="bc-info-label">Contract</span>
                    <span style={{ wordBreak: "break-all", fontSize: 11 }}>
                      {status?.contract_address
                        ? `✅ ${status.contract_address.slice(0, 10)}…${status.contract_address.slice(-6)}`
                        : "Not Deployed"}
                    </span>
                  </div>
                  <div className="bc-info-item">
                    <span className="bc-info-label">Candidates</span>
                    <span>{status?.candidate_count ?? 0}</span>
                  </div>
                  <div className="bc-info-item">
                    <span className="bc-info-label">Total Votes</span>
                    <span>{status?.total_votes ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* ── Admin Controls ───────────────────────────────────── */}
              <div className="bc-card">
                <div className="bc-card-title">🔧 Admin Controls</div>
                <div className="bc-controls-row">

                  <div className="bc-control-btn-wrap">
                    <button
                      className="bc-btn bc-btn--deploy"
                      onClick={() => doAction("deploy", "Contract Deploy")}
                      disabled={busy || !status?.ganache_connected}
                    >
                      🚀 Deploy Contract
                    </button>
                    <p className="bc-btn-desc">Deploy or redeploy the Election smart contract to Ganache.</p>
                  </div>

                  <div className="bc-control-btn-wrap">
                    <button
                      className="bc-btn bc-btn--add"
                      onClick={() => doAction("add-candidates", "Add Candidates")}
                      disabled={busy || !status?.contract_deployed || status?.voting_open}
                    >
                      👥 Sync Candidates
                    </button>
                    <p className="bc-btn-desc">Pull all approved candidates from nominations onto the blockchain.</p>
                  </div>

                  <div className="bc-control-btn-wrap">
                    <button
                      className={`bc-btn ${status?.voting_open ? "bc-btn--end" : "bc-btn--start"}`}
                      onClick={() => doAction(
                        status?.voting_open ? "end-voting" : "start-voting",
                        status?.voting_open ? "End Voting" : "Start Voting"
                      )}
                      disabled={busy || !status?.contract_deployed || (status?.candidate_count === 0)}
                    >
                      {status?.voting_open ? "🛑 End Voting" : "▶️ Start Voting"}
                    </button>
                    <p className="bc-btn-desc">
                      {status?.voting_open
                        ? "Close the election and finalize results."
                        : "Open the polls for registered voters."}
                    </p>
                  </div>

                </div>
              </div>

              {/* ── Live Results ─────────────────────────────────────── */}
              {candidates.length > 0 && (
                <div className="bc-card">
                  <div className="bc-card-title" style={{ borderBottom: "1px solid #eee", paddingBottom: 12, marginBottom: 16 }}>
                    📊 Live Results by Position
                    <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 10, opacity: 0.6 }}>
                      auto-refreshes every 8s
                    </span>
                  </div>

                  {[...new Set(candidates.map(c => c.position))].sort().map(posName => {
                    const posCands = candidates.filter(c => c.position === posName).sort((a, b) => b.vote_count - a.vote_count);
                    const maxV = posCands[0].vote_count;
                    const tied = maxV > 0 && posCands.filter(c => c.vote_count === maxV).length > 1;

                    return (
                      <div key={posName} style={{ marginBottom: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                          <h4 style={{ margin: 0, color: "#1e3c72", fontSize: 15 }}>{posName}</h4>
                          {maxV > 0 && (
                            tied
                              ? <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 700, padding: "2px 8px", background: "#f8f9fa", borderRadius: 12 }}>⚖️ Tied</span>
                              : <span style={{ fontSize: 11, color: "#1e7e34", fontWeight: 700, padding: "2px 8px", background: "#e6f4ea", borderRadius: 12 }}>🏆 Lead: {posCands[0].name}</span>
                          )}
                        </div>
                        <div className="bc-results-table">
                          <div className="bc-table-header">
                            <span>#</span>
                            <span>Candidate</span>
                            <span>Symbol</span>
                            <span>Votes</span>
                            <span style={{ minWidth: 140 }}>Share</span>
                          </div>
                          {posCands.map((c, i) => {
                            const isLeading = maxV > 0 && c.vote_count === maxV && !tied;
                            return (
                              <div key={c.id} className={`bc-table-row ${isLeading ? "bc-row--leading" : ""}`}>
                                <span>{isLeading ? "🏆" : i + 1}</span>
                                <span><strong>{c.name}</strong></span>
                                <span>{c.symbol}</span>
                                <span><strong>{c.vote_count}</strong></span>
                                <span><ProgressBar value={c.vote_count} max={Math.max(totalVotes, 1)} /></span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Transaction Log ──────────────────────────────────── */}
              {txLog.length > 0 && (
                <div className="bc-card">
                  <div className="bc-card-title">🔗 Transaction Log</div>
                  {txLog.map((t, i) => (
                    <div key={i} className="bc-tx-row">
                      <span className="bc-tx-label">{t.label}</span>
                      <span className="bc-tx-hash">{t.hash}</span>
                      <span className="bc-tx-time">{t.at}</span>
                    </div>
                  ))}
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
