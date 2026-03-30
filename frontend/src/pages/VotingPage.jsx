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
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [currentPin, setCurrentPin] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpField, setShowOtpField] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [pinSetupMode, setPinSetupMode] = useState(false);
    const [resetMode, setResetMode] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [sRes, cRes, vRes] = await Promise.all([
                API("/blockchain/status"),
                API("/blockchain/candidates"),
                API("/blockchain/voter-status"),
            ]);
            if (sRes.data.success) setStatus(sRes.data);
            if (cRes.data.success) setCandidates(cRes.data.candidates || []);
            if (vRes.data.success) {
                setVoterStatus(vRes.data);
                setPinSetupMode(!vRes.data.pin_setup);
            }
        } catch {
            setError("Failed to load voting information. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSetupPin = async () => {
        if (pin.length !== 6 || !/^\d+$/.test(pin)) {
            setError("PIN must be exactly 6 digits.");
            return;
        }
        if (pin !== confirmPin) {
            setError("PINs do not match.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const res = await API("/voting-pin/setup", {
                method: "post",
                data: { pin }
            });
            if (res.data.success) {
                setPin("");
                setConfirmPin("");
                setPinSetupMode(false);
                fetchData();
            } else {
                setError(res.data.message);
            }
        } catch (e) {
            setError(e.response?.data?.message || "Failed to setup PIN");
        } finally {
            setBusy(false);
        }
    };

    const handleSendOtp = async () => {
        if (pin.length !== 6) {
            setError("Please enter your 6-digit PIN first.");
            return;
        }
        setOtpLoading(true);
        setError("");
        try {
            const res = await API("/send-otp", {
                method: "post",
                data: { 
                    voter_id: voterStatus?.voter_id || localStorage.getItem("voterId"),
                    email: voterStatus?.email || localStorage.getItem("email") 
                }
            });
            if (res.data.success) {
                setShowOtpField(true);
            } else {
                setError(res.data.message);
            }
        } catch (e) {
            setError(e.response?.data?.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSelect = (pos, cid) => {
        setSelections(prev => ({ ...prev, [pos]: cid }));
    };

    const handleCastVote = async () => {
        const selectedIds = Object.values(selections);
        if (!otp) {
            setError("Please enter the OTP sent to your email.");
            return;
        }

        setBusy(true);
        setError("");
        try {
            const res = await API("/blockchain/cast-vote", {
                method: "post",
                data: {
                    candidate_ids: selectedIds,
                    pin: pin,
                    otp: otp
                },
            });

            if (res.data.success) {
                const selectedCands = candidates.filter(c => selectedIds.includes(c.id));
                setSuccess({
                    tx_hash: res.data.tx_hash,
                    block_number: res.data.block_number,
                    candidates: selectedCands
                });
                setConfirming(false);
            } else {
                setError(res.data.message || "Failed to cast vote");
            }
        } catch (e) {
            let msg = e.response?.data?.message || e.message || "Vote failed";
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    const handleResetPin = async () => {
        if (currentPin.length !== 6 || pin.length !== 6 || confirmPin.length !== 6) {
            setError("All PIN fields must be exactly 6 digits.");
            return;
        }
        if (pin !== confirmPin) {
            setError("New PINs do not match.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const res = await API("/voting-pin/reset", {
                method: "post",
                data: { 
                    current_pin: currentPin,
                    new_pin: pin
                }
            });
            if (res.data.success) {
                setPin("");
                setConfirmPin("");
                setCurrentPin("");
                setResetMode(false);
                alert("PIN reset successfully!");
            } else {
                setError(res.data.message || "Failed to reset PIN");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error resetting PIN");
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


    // ── PIN Setup Screen ──────────────────────────────────────────────────────
    if (pinSetupMode) {
        return (
            <div className="vd-wrapper">
                <header className="vd-header">
                    <div className="vd-header-inner">
                        <h1 className="vd-website-name">ELECTRA</h1>
                        <button className="btn-logout" onClick={() => navigate("/voter-dashboard")}>← Dashboard</button>
                    </div>
                </header>
                <main className="vd-main">
                    <div className="vote-closed-card" style={{ maxWidth: 500, margin: "0 auto" }}>
                        <div style={{ fontSize: 48 }}>🛡️</div>
                        <h2 style={{ marginTop: 16 }}>Secure Your Vote</h2>
                        <p style={{ opacity: 0.7, fontSize: 15, marginBottom: 24 }}>
                            Before you can vote, you must set a 6-digit <strong>Voting PIN</strong>. 
                            This PIN will be used to encrypt your blockchain digital signature.
                        </p>
                        
                        {error && <div className="bc-flash bc-flash--error" style={{ marginBottom: 16 }}>{error}</div>}

                        <div className="pin-input-group" style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", marginBottom: 8, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Create 6-Digit PIN</label>
                            <input 
                                type="password" 
                                maxLength="6"
                                placeholder="● ● ● ● ● ●"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: 8, textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                            />
                        </div>

                        <div className="pin-input-group" style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", marginBottom: 8, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Confirm PIN</label>
                            <input 
                                type="password" 
                                maxLength="6"
                                placeholder="● ● ● ● ● ●"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: 8, textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                            />
                        </div>

                        <button 
                            className="bc-btn bc-btn--start" 
                            style={{ width: "100%" }} 
                            onClick={handleSetupPin}
                            disabled={busy || pin.length !== 6 || confirmPin.length !== 6}
                        >
                            {busy ? "Initializing Wallet..." : "Set Voting PIN →"}
                        </button>

                        <p style={{ fontSize: 12, opacity: 0.5, marginTop: 16 }}>
                            ⚠️ Do not share this PIN. It will be required every time you cast a vote.
                        </p>
                    </div>
                </main>
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

    // ── PIN Reset Screen ──────────────────────────────────────────────────────
    if (resetMode) {
        return (
            <div className="vd-wrapper">
                <header className="vd-header">
                    <div className="vd-header-inner">
                        <h1 className="vd-website-name">ELECTRA</h1>
                        <button className="btn-logout" onClick={() => setResetMode(false)}>← Cancel</button>
                    </div>
                </header>
                <main className="vd-main">
                    <div className="vote-closed-card" style={{ maxWidth: 500, margin: "0 auto" }}>
                        <div style={{ fontSize: 48 }}>⚙️</div>
                        <h2 style={{ marginTop: 16 }}>Reset Voting PIN</h2>
                        <p style={{ opacity: 0.7, fontSize: 15, marginBottom: 24 }}>
                            Enter your current 6-digit PIN and then choose a new one.
                        </p>
                        
                        {error && <div className="bc-flash bc-flash--error" style={{ marginBottom: 16 }}>{error}</div>}

                        <div className="pin-input-group" style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", marginBottom: 8, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Current 6-Digit PIN</label>
                            <input 
                                type="password" 
                                maxLength="6"
                                placeholder="● ● ● ● ● ●"
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: 8, textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                            />
                        </div>

                        <div className="pin-input-group" style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", marginBottom: 8, textAlign: "left", fontSize: 13, fontWeight: 600 }}>New 6-Digit PIN</label>
                            <input 
                                type="password" 
                                maxLength="6"
                                placeholder="● ● ● ● ● ●"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: 8, textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                            />
                        </div>

                        <div className="pin-input-group" style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", marginBottom: 8, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Confirm New PIN</label>
                            <input 
                                type="password" 
                                maxLength="6"
                                placeholder="● ● ● ● ● ●"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "12px", border: "2px solid #ddd", borderRadius: 8, textAlign: "center", fontSize: 24, letterSpacing: 8 }}
                            />
                        </div>

                        <button 
                            className="bc-btn bc-btn--start" 
                            style={{ width: "100%" }} 
                            onClick={handleResetPin}
                            disabled={busy || pin.length !== 6 || confirmPin.length !== 6 || currentPin.length !== 6}
                        >
                            {busy ? "Updating PIN..." : "Update Voting PIN →"}
                        </button>
                    </div>
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


    // ── Main Voting Booth ─────────────────────────────────────────────────────
    return (
        <div className="vd-wrapper">
            <header className="vd-header">
                <div className="vd-header-inner">
                    <h1 className="vd-website-name">ELECTRA</h1>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span className="bc-badge bc-badge--open">🟢 Voting Open</span>
                        <button className="btn-logout" style={{ background: "#495057" }} onClick={() => {
                            setError("");
                            setPin("");
                            setConfirmPin("");
                            setCurrentPin("");
                            setResetMode(true);
                        }}>⚙️ Reset PIN</button>
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

                    {error && !confirming && <div className="bc-flash bc-flash--error">{error}</div>}

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
                                    onClick={() => {
                                        setError("");
                                        setPin("");
                                        setOtp("");
                                        setShowOtpField(false);
                                        setConfirming(true);
                                    }}
                                    disabled={busy || Object.keys(selections).length === 0}
                                >
                                    Confirm Ballot →
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* ── Confirm Modal (Multi-Step) ─────────────────────────────────────────── */}
            {confirming && (
                <div className="vote-modal-overlay" onClick={() => !busy && setConfirming(false)}>
                    <div className="vote-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
                        <div className="vote-modal-title">🛡️ Secure Ballot Submission</div>
                        
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 13, marginBottom: 12 }}>You are about to cast votes for:</p>
                            <div className="ballot-summary" style={{ maxHeight: 150, overflowY: "auto", background: "#f1f3f5", padding: 10, borderRadius: 6 }}>
                                {Object.entries(selections).map(([pos, cid]) => {
                                    const cand = candidates.find(c => c.id === cid);
                                    return (
                                        <div key={pos} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #dee2e6" }}>
                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{pos}:</span>
                                            <span style={{ fontSize: 12 }}>{cand?.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {error && <div className="bc-flash bc-flash--error" style={{ marginBottom: 16, fontSize: 12 }}>{error}</div>}

                        <div className="security-steps" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Step 1: PIN */}
                            <div className="secure-input-step">
                                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>1. Enter Voting PIN</label>
                                <input 
                                    type="password" 
                                    maxLength="6"
                                    placeholder="Enter your 6-digit PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                    style={{ width: "100%", padding: "10px", border: "1px solid #ced4da", borderRadius: 4, letterSpacing: 4 }}
                                />
                            </div>

                            {/* Step 2: OTP Request & Entry */}
                            <div className="secure-input-step">
                                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>2. Identity Verification</label>
                                {!showOtpField ? (
                                    <button 
                                        className="bc-btn" 
                                        style={{ width: "100%", background: "#495057", color: "#fff", padding: "10px" }}
                                        onClick={handleSendOtp}
                                        disabled={otpLoading || pin.length !== 6}
                                    >
                                        {otpLoading ? "Sending OTP..." : "Get OTP via Email"}
                                    </button>
                                ) : (
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            style={{ flex: 1, padding: "10px", border: "1px solid #ced4da", borderRadius: 4, textAlign: "center", letterSpacing: 4 }}
                                        />
                                        <button 
                                            className="bc-btn" 
                                            style={{ padding: "0 15px", fontSize: 12 }} 
                                            onClick={handleSendOtp}
                                            disabled={otpLoading}
                                        >
                                            Resend
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 20 }}>
                            Proceeding will cryptographically sign your ballot and store it on the blockchain. This cannot be undone.
                        </p>

                        <div className="vote-modal-actions" style={{ marginTop: 24 }}>
                            <button className="bc-btn bc-btn--end" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
                            <button 
                                className="bc-btn bc-btn--start" 
                                onClick={handleCastVote} 
                                disabled={busy || pin.length !== 6 || otp.length !== 6}
                            >
                                {busy ? "Blockchain Broadcasting..." : "🔒 Finalize & Cast Vote"}
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
