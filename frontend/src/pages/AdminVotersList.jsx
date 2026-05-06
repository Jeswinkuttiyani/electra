import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Voterdash.css";

function AdminVotersList() {
  const navigate = useNavigate();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchVoterId, setSearchVoterId] = useState("");
  const [failedPhotos, setFailedPhotos] = useState(() => new Set());
  const editCardRef = useRef(null);

  const formatAddress = (address) => {
    if (!address) return "—";
    if (typeof address === "string") return address || "—";
    if (typeof address === "object") {
      const houseName = address.house_name;
      const houseNumber = address.house_number;
      const streetName = address.street_name;
      const place = address.place;
      const combined = [houseName, houseNumber, streetName, place].filter(Boolean).join(", ");
      return combined || "—";
    }
    return String(address);
  };

  const backendOrigin = String(api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");

  const getPhotoSrc = (photoUrl) => {
    if (!photoUrl) return null;
    if (typeof photoUrl !== "string") return null;
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
    const normalized = photoUrl.startsWith("/") ? photoUrl.slice(1) : photoUrl;
    if (!backendOrigin) return `/${normalized}`;
    return `${backendOrigin}/${normalized}`;
  };

  const [editingVoterId, setEditingVoterId] = useState(null);
  const [editState, setEditState] = useState({
    full_name: "",
    date_of_birth: "",
    address: "",
    email: "",
    phone_no: "",
    branch_name: "",
    photo_url: "",
  });

  const fetchVoters = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/voters", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setVoters(res.data.voters || []);
      } else {
        setMessage(res.data.message || "Failed to fetch voters list");
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

  useEffect(() => {
    if (!editingVoterId) return;
    const el = editCardRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingVoterId]);

  const filteredVoters = useMemo(() => {
    const q = (searchVoterId || "").trim();
    if (!q) return voters;
    return voters.filter((v) => String(v.voter_id || "").includes(q));
  }, [voters, searchVoterId]);

  const openEdit = (voter) => {
    setMessage("");
    setEditingVoterId(voter.voter_id);
    setEditState({
      full_name: voter.full_name || "",
      date_of_birth: voter.date_of_birth || "",
      address: formatAddress(voter.address) === "—" ? "" : formatAddress(voter.address),
      email: voter.email || "",
      phone_no: voter.phone_no || "",
      branch_name: voter.branch_name || "",
      photo_url: voter.photo_url || "",
    });
  };

  const closeEdit = () => {
    setEditingVoterId(null);
  };

  const handleEditChange = (field, value) => {
    setEditState((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingVoterId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/voter/${editingVoterId}`, editState, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setMessage("Voter updated");
        closeEdit();
        fetchVoters();
      } else {
        setMessage(res.data.message || "Failed to update voter");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update voter");
    }
  };

  const handleDelete = async (voterId) => {
    if (!window.confirm(`Are you sure you want to delete voter ${voterId}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await api.delete(`/voter/${voterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setMessage(`Voter ${voterId} deleted`);
        fetchVoters();
      } else {
        setMessage(res.data.message || "Failed to delete voter");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete voter");
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
          <h2 className="vd-section-title">Voters List (Admin)</h2>
          <div className="vd-section-subtitle">Search voters by Voter ID and modify details</div>

          <div className="admin-edit-card" style={{ marginTop: 0 }}>
            <div className="report-form">
              <div className="report-field report-field--grow">
                <label htmlFor="searchVoterId">Voter ID</label>
                <input
                  id="searchVoterId"
                  className="report-input"
                  type="text"
                  placeholder="Enter Voter ID"
                  value={searchVoterId}
                  onChange={(e) => setSearchVoterId(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              <div className="report-actions">
                <button className="btn-cancel" type="button" onClick={() => setSearchVoterId("")}>Clear</button>
              </div>
            </div>
          </div>

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
                    <th>Full Name</th>
                    <th>DOB</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Branch</th>
                    <th>Address</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVoters.length > 0 ? (
                    filteredVoters.map((voter, idx) => (
                      <tr key={voter._id || voter.voter_id}>
                        <td>{idx + 1}</td>
                        <td>{voter.voter_id}</td>
                        <td>{voter.full_name || voter.name}</td>
                        <td>{voter.date_of_birth || "—"}</td>
                        <td>{voter.email || "—"}</td>
                        <td>{voter.phone_no || "—"}</td>
                        <td>{voter.branch_name || "—"}</td>
                        <td>{formatAddress(voter.address)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="vd-tile-btn" style={{ padding: "6px 12px", maxWidth: 80 }} onClick={() => openEdit(voter)}>
                              Modify
                            </button>
                            <button className="btn-cancel" style={{ padding: "6px 12px", background: "#fee2e2", color: "#991b1b", border: "1px solid #ef4444" }} onClick={() => handleDelete(voter.voter_id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-voters">No voters found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {editingVoterId && (
            <div className="admin-edit-card" ref={editCardRef}>
              <h3 style={{ margin: 0 }}>Modify Voter: {editingVoterId}</h3>

              <div className="admin-edit-grid" style={{ marginTop: 12 }}>
                <div className="admin-edit-field">
                  <label htmlFor="edit_full_name">Full Name</label>
                  <input id="edit_full_name" value={editState.full_name} onChange={(e) => handleEditChange("full_name", e.target.value)} />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="edit_dob">Date of Birth</label>
                  <input id="edit_dob" type="date" value={editState.date_of_birth} onChange={(e) => handleEditChange("date_of_birth", e.target.value)} />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="edit_email">Email</label>
                  <input id="edit_email" type="email" value={editState.email} onChange={(e) => handleEditChange("email", e.target.value)} />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="edit_phone">Phone</label>
                  <input id="edit_phone" value={editState.phone_no} onChange={(e) => handleEditChange("phone_no", e.target.value)} />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="edit_branch">Branch</label>
                  <input id="edit_branch" value={editState.branch_name} onChange={(e) => handleEditChange("branch_name", e.target.value)} />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="edit_photo">Photo URL</label>
                  <input id="edit_photo" value={editState.photo_url} onChange={(e) => handleEditChange("photo_url", e.target.value)} />
                </div>

                <div className="admin-edit-field" style={{ flex: "1 1 100%" }}>
                  <label htmlFor="edit_address">Address</label>
                  <input id="edit_address" value={editState.address} onChange={(e) => handleEditChange("address", e.target.value)} />
                </div>
              </div>

              <div className="admin-edit-actions">
                <button className="vd-tile-btn" onClick={saveEdit}>Save Changes</button>
                <button className="btn-cancel" onClick={closeEdit} style={{ marginLeft: 8 }}>Cancel</button>
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

export default AdminVotersList;
