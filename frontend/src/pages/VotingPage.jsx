import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

const backendOrigin = String(api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");

const API = (path, opts = {}) => {
    const token = localStorage.getItem("token");
    return api({ url: path, headers: { Authorization: `Bearer ${token}` }, ...opts });
};

function CandidateCard({ candidate, selected, onSelect, disabled }) {
    const photoSrc = candidate.candidate_photo_url
        ? `${backendOrigin}${candidate.candidate_photo_url}`
        : null;

    return (
        <div
            className={`vote-card ${selected ? "vote-card--selected" : ""} ${disabled ? "vote-card--disabled" : ""}`}
            onClick={() => !disabled && onSelect(candidate.id)}
        >
            <div className="vote-card-photo">
                {photoSrc
                    ? <img src={photoSrc} alt={candidate.name} onError={e => { e.target.style.display = "none"; }} />
                    : <div className="vote-card-avatar">👤</div>}
            </div>
            <div className="vote-card-info">
                <div className="vote-card-name">{candidate.name}</div>
                <div className="vote-card-position">{candidate.position}</div>
                {candidate.symbol && (
                    <div className="vote-card-symbol">Symbol: <strong>{candidate.symbol}</strong></div>
                )}
                {candidate.branch_name && (
                    <div className="vote-card-branch">{candidate.branch_name}</div>
                )}
                {candidate.statement && (
                    <div className="vote-card-statement">{candidate.statement}</div>
                )}
            </div>
            {selected && <div className="vote-card-check">✓ Selected</div>}
        </div>
    );
}

export default function VotingPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [voterStatus, setVoterStatus] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState(null); // { tx_hash, candidate_name }
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [sRes, cRes, vRes] = await Promise.all([
                API("/blockchain/status"),
                API("/blockchain/candidates"),
                API("/blockchain/voter-status"),
            ]);
            if (sRes.data.success) setStatus(sRes.data);
            if (cRes.data.success) setCandidates(cRes.data.candidates || []);
            if (vRes.data.success) setVoterStatus(vRes.data);
        } catch {
            setError("Failed to load voting information. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCastVote = async () => {
        if (!selected) return;
        setBusy(true);
        setError("");
        try {
            const res = await API("/blockchain/cast-vote", {
                method: "post",
                data: { candidate_id: selected },
            });
            if (res.data.success) {
                const cand = candidates.find(c => c.id === selected);
                setSuccess({
                    tx_hash: res.data.tx_hash,
                    block_number: res.data.block_number,
                    candidate_name: cand?.name || "Unknown",
                    candidate_position: cand?.position || "",
                });
                setConfirming(false);
            } else {
                setError(res.data.message || "Failed to cast vote");
                setConfirming(false);
            }
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Vote failed");
            setConfirming(false);
        } finally {
            setBusy(false);
        }
    };

    const selectedCandidate = candidates.find(c => c.id === selected);

    if (loading) {
        return (
            <div className="vd-wrapper">
                <header className="vd-header">
                    <div className="vd-header-inner"><h1 className="vd-website-name">ELECTRA</h1></div>
                </header>
                <main className="vd-main" style={{ textAlign: "center", paddingTop: 60 }}>
                    <div className="bc-spinner">Loading voting booth…</div>
                </main>
            </div>
        );
    }

    // ── Already Voted Screen ──────────────────────────────────────────────────
    if (voterStatus?.has_voted && !success) {
        return (
            <div className="vd-wrapper">
                <header className="vd-header">
                    <div className="vd-header-inner">
                        <h1 className="vd-website-name">ELECTRA</h1>
                        <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>← Dashboard</button>
                    </div>
                </header>
                <main className="vd-main">
                    <div className="vote-already-card">
                        <div className="vote-already-icon">✅</div>
                        <h2>You have already voted!</h2>
                        <p>Your vote has been securely recorded on the blockchain.</p>
                        {voterStatus.tx_hash && (
                            <div className="vote-tx-box">
                                <span className="vote-tx-label">Transaction Hash</span>
                                <span className="vote-tx-hash">{voterStatus.tx_hash}</span>
                            </div>
                        )}
                        <button className="vd-tile-btn" style={{ maxWidth: 200, marginTop: 24 }} onClick={() => navigate("/election-results")}>
                            View Results →
                        </button>
                    </div>
                </main>
                <footer className="vd-footer">
                    <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology.</div>
                </footer>
            </div>
        );
    }

    // ── Vote Success Screen ───────────────────────────────────────────────────
    if (success) {
        return (
            <div className="vd-wrapper">
                <header className="vd-header">
                    <div className="vd-header-inner">
                        <h1 className="vd-website-name">ELECTRA</h1>
                        <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>← Dashboard</button>
                    </div>
                </header>
                <main className="vd-main">
                    <div className="vote-success-card">
                        <div className="vote-success-icon">🗳️</div>
                        <h2 className="vote-success-title">Vote Cast Successfully!</h2>
                        <p className="vote-success-sub">
                            Your vote for <strong>{success.candidate_name}</strong> ({success.candidate_position}) has been recorded on the Ethereum blockchain.
                        </p>
                        <div className="vote-tx-box">
                            <span className="vote-tx-label">⛓️ Transaction Hash</span>
                            <span className="vote-tx-hash">{success.tx_hash}</span>
                        </div>
                        {success.block_number && (
                            <div className="vote-tx-box">
                                <span className="vote-tx-label">📦 Block Number</span>
                                <span className="vote-tx-hash">#{success.block_number}</span>
                            </div>
                        )}
                        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>
                            Your vote is immutable and cannot be altered.
                        </p>
                        <button className="vd-tile-btn" style={{ maxWidth: 220, marginTop: 24 }} onClick={() => navigate("/election-results")}>
                            View Live Results →
                        </button>
                    </div>
                </main>
                <footer className="vd-footer">
                    <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology.</div>
                </footer>
            </div>
        );
    }

    // ── Voting Not Open ───────────────────────────────────────────────────────
    if (!status?.voting_open) {
        return (
            <div className="vd-wrapper">
                <header className="vd-header">
                    <div className="vd-header-inner">
                        <h1 className="vd-website-name">ELECTRA</h1>
                        <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>← Dashboard</button>
                    </div>
                </header>
                <main className="vd-main">
                    <div className="vote-closed-card">
                        <div style={{ fontSize: 56 }}>🔒</div>
                        <h2 style={{ marginTop: 16 }}>
                            {!status?.ganache_connected
                                ? "Blockchain Offline"
                                : !status?.contract_deployed
                                    ? "Election Not Started"
                                    : "Voting is Closed"}
                        </h2>
                        <p style={{ opacity: 0.7, fontSize: 15 }}>
                            {!status?.ganache_connected
                                ? "The blockchain network is not available right now. Please try again later."
                                : !status?.contract_deployed
                                    ? "The admin has not deployed the voting contract yet. Please wait for the election to begin."
                                    : "The voting period has ended. Check the results below."}
                        </p>
                        {!status?.voting_open && status?.contract_deployed && (
                            <button className="vd-tile-btn" style={{ maxWidth: 220, marginTop: 24 }} onClick={() => navigate("/election-results")}>
                                View Results →
                            </button>
                        )}
                    </div>
                </main>
                <footer className="vd-footer">
                    <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology.</div>
                </footer>
            </div>
        );
    }

    // ── Main Voting Booth ─────────────────────────────────────────────────────
    return (
        <div className="vd-wrapper">
            <header className="vd-header">
                <div className="vd-header-inner">
                    <h1 className="vd-website-name">ELECTRA</h1>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span className="bc-badge bc-badge--open">🟢 Voting Open</span>
                        <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>← Dashboard</button>
                    </div>
                </div>
            </header>

            <main className="vd-main">
                <section>
                    <h2 className="vd-section-title">🗳️ Cast Your Vote</h2>
                    <div className="vd-section-subtitle">
                        Select a candidate below and confirm your vote. <strong>You can only vote once.</strong>
                    </div>

                    {error && <div className="bc-flash bc-flash--error">{error}</div>}

                    {candidates.length === 0 ? (
                        <div className="vote-closed-card">
                            <p>No candidates have been added to the election yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="vote-candidates-grid">
                                {candidates.map(c => (
                                    <CandidateCard
                                        key={c.id}
                                        candidate={c}
                                        selected={selected === c.id}
                                        onSelect={setSelected}
                                        disabled={false}
                                    />
                                ))}
                            </div>

                            <div className="vote-submit-row">
                                {selected ? (
                                    <button
                                        className="bc-btn bc-btn--start"
                                        style={{ minWidth: 220, fontSize: 16, padding: "14px 32px" }}
                                        onClick={() => setConfirming(true)}
                                        disabled={busy}
                                    >
                                        Confirm Vote →
                                    </button>
                                ) : (
                                    <p style={{ opacity: 0.6 }}>← Select a candidate to continue</p>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* ── Confirm Modal ─────────────────────────────────────────── */}
            {confirming && selectedCandidate && (
                <div className="vote-modal-overlay" onClick={() => !busy && setConfirming(false)}>
                    <div className="vote-modal" onClick={e => e.stopPropagation()}>
                        <div className="vote-modal-title">⚠️ Confirm Your Vote</div>
                        <p className="vote-modal-body">
                            You are about to cast your vote for:
                        </p>
                        <div className="vote-modal-candidate">
                            <strong>{selectedCandidate.name}</strong>
                            <span>{selectedCandidate.position}</span>
                        </div>
                        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
                            This action is <strong>irreversible</strong> and will be recorded permanently on the blockchain.
                        </p>
                        <div className="vote-modal-actions">
                            <button
                                className="bc-btn bc-btn--end"
                                onClick={() => setConfirming(false)}
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button
                                className="bc-btn bc-btn--start"
                                onClick={handleCastVote}
                                disabled={busy}
                            >
                                {busy ? "Submitting…" : "✅ Yes, Cast My Vote"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="vd-footer">
                <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology. All Rights Reserved.</div>
            </footer>
        </div>
    );
}
