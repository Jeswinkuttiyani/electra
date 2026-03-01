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
    const [selections, setSelections] = useState({}); // { positionName: candidateId }
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState(null); // { tx_hash, candidate_names }
    const [error, setError] = useState("");
    const [walletAddress, setWalletAddress] = useState(localStorage.getItem("walletAddress") || "");

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

    const handleSelect = (pos, cid) => {
        setSelections(prev => ({ ...prev, [pos]: cid }));
    };

    const handleCastVote = async () => {
        const selectedIds = Object.values(selections);
        if (selectedIds.length === 0) {
            setError("Please select at least one candidate.");
            return;
        }

        if (!window.ethereum) {
            setError("MetaMask is required to cast a vote.");
            return;
        }

        setBusy(true);
        setError("");
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const address = accounts[0];

            if (walletAddress && address.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error(`Please switch to your linked wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
            }

            // Standardize format to avoid space/mismatch issues: [1,2,3]
            const ballotIds = [...selectedIds].sort((a, b) => a - b);
            const selectedCands = candidates.filter(c => selectedIds.includes(c.id));
            const message = `Casting my vote for Ballot: [${ballotIds.join(",")}]`;
            console.log("SIGNING MESSAGE:", message);
            console.log("FOR ADDRESS:", address);

            const signature = await window.ethereum.request({
                method: "personal_sign",
                params: [message, address],
            });

            const res = await API("/blockchain/cast-vote", {
                method: "post",
                data: {
                    candidate_ids: selectedIds,
                    signature: signature,
                    address: address,
                    message: message
                },
            });

            if (res.data.success) {
                setSuccess({
                    tx_hash: res.data.tx_hash,
                    block_number: res.data.block_number,
                    candidates: selectedCands
                });
                setConfirming(false);
            } else {
                setError(res.data.message || "Failed to cast vote");
                setConfirming(false);
            }
        } catch (e) {
            let msg = e.response?.data?.message || e.message || "Vote failed";
            if (msg.includes("sender account not recognized")) {
                msg = "Blockchain Session Expired: Your wallet is not recognized by the current chain. Please go back to the Dashboard and use the 'Change' button to re-link your wallet.";
            }
            setError(msg);
            setConfirming(false);
        } finally {
            setBusy(false);
        }
    };

    // Group candidates by position
    const positions = [...new Set(candidates.map(c => c.position))];

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

    // ── Wallet Link Enforcement Screen ─────────────────────────────────────────
    if (!walletAddress) {
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
                        <div style={{ fontSize: 56 }}>🦊</div>
                        <h2 style={{ marginTop: 16 }}>MetaMask Link Required</h2>
                        <p style={{ opacity: 0.7, fontSize: 15, maxWidth: 500, margin: "16px auto" }}>
                            For maximum security, Electra now requires a linked MetaMask wallet to cast votes.
                            Please go to your dashboard and link your wallet first.
                        </p>
                        <button className="vd-tile-btn" style={{ maxWidth: 220, marginTop: 24 }} onClick={() => navigate("/voter-dashboard")}>
                            Go to Dashboard →
                        </button>
                    </div>
                </main>
                <footer className="vd-footer">
                    <div className="vd-footer-inner">© 2025 St. Joseph's College of Engineering & Technology.</div>
                </footer>
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
                        <p>Your multi-position ballot has been securely recorded on the blockchain.</p>
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
                        <h2 className="vote-success-title">Ballot Cast Successfully!</h2>
                        <div style={{ margin: "20px 0", textAlign: "left" }}>
                            <p style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Your Choices:</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {success.candidates.map(c => (
                                    <div key={c.id} style={{ background: "#f8f9fa", padding: "8px 12px", borderRadius: 6, fontSize: 13, borderLeft: "3px solid #1e3c72" }}>
                                        <div style={{ fontWeight: 700 }}>{c.position}</div>
                                        <div>{c.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                    <h2 className="vd-section-title">🗳️ Ballot Booth</h2>
                    <div className="vd-section-subtitle">
                        Select **one member** for each position. <strong>You can only cast your ballot once.</strong>
                    </div>

                    {error && <div className="bc-flash bc-flash--error">{error}</div>}

                    {candidates.length === 0 ? (
                        <div className="vote-closed-card">
                            <p>No candidates have been added to the election yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="ballot-sections">
                                {positions.sort().map(posName => (
                                    <div key={posName} className="ballot-section" style={{ marginBottom: 40, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
                                        <h3 style={{ marginBottom: 20, color: "#1e3c72", borderLeft: "4px solid #1e3c72", paddingLeft: 12 }}>
                                            {posName}
                                        </h3>
                                        <div className="vote-candidates-grid">
                                            {candidates
                                                .filter(c => c.position === posName)
                                                .map(c => (
                                                    <CandidateCard
                                                        key={c.id}
                                                        candidate={c}
                                                        selected={selections[posName] === c.id}
                                                        onSelect={(cid) => handleSelect(posName, cid)}
                                                        disabled={busy}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="vote-submit-row">
                                <button
                                    className="bc-btn bc-btn--start"
                                    style={{ minWidth: 260, fontSize: 16, padding: "14px 32px" }}
                                    onClick={() => setConfirming(true)}
                                    disabled={busy || Object.keys(selections).length === 0}
                                >
                                    Confirm Ballot →
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* ── Confirm Modal ─────────────────────────────────────────── */}
            {confirming && (
                <div className="vote-modal-overlay" onClick={() => !busy && setConfirming(false)}>
                    <div className="vote-modal" onClick={e => e.stopPropagation()}>
                        <div className="vote-modal-title">⚠️ Confirm Your Ballot</div>
                        <p className="vote-modal-body">
                            You have selected <strong>{Object.keys(selections).length}</strong> candidates.
                            Confirm your choices before submitting to the blockchain:
                        </p>

                        <div className="ballot-summary" style={{ maxHeight: 250, overflowY: "auto", margin: "15px 0", background: "#f8f9fa", padding: 12, borderRadius: 8 }}>
                            {Object.entries(selections).map(([pos, cid]) => {
                                const cand = candidates.find(c => c.id === cid);
                                return (
                                    <div key={pos} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #ddd" }}>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{pos}:</span>
                                        <span style={{ fontSize: 13 }}>{cand?.name}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <p style={{ fontSize: 12, opacity: 0.7 }}>
                            This action uses your Linked MetaMask Wallet and is <strong>permanent</strong>.
                        </p>

                        <div className="vote-modal-actions">
                            <button className="bc-btn bc-btn--end" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
                            <button className="bc-btn bc-btn--start" onClick={handleCastVote} disabled={busy}>
                                {busy ? "Signing…" : "✅ Cast My Ballot"}
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
