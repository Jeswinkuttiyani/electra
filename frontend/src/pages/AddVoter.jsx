import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api";
import "../styles/AddVoter.css";

function AddVoter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    address: {
      house_name: "",
      house_number: "",
      street_name: "",
      place: ""
    },
    voter_id: "",
    email: "",
    phone_no: "",
    branch_name: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const excelFileRef = useRef(null);

  const [excelImporting, setExcelImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // { done, total }
  const [bulkResults, setBulkResults] = useState(null);   // [{ name, voter_id, status, msg }]
  const [showIndividualForm, setShowIndividualForm] = useState(false);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "admin") {
      navigate("/admin-dashboard");
    }
  }, [navigate]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    // Support nested address fields named like address.house_name
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Validation
    // Required fields
    if (!formData.full_name || !formData.date_of_birth || !formData.voter_id || !formData.email || !formData.phone_no || !formData.branch_name) {
      setMessageType("error");
      setMessage("Please fill in all required fields");
      setLoading(false);
      return;
    }

    // Name: letters and spaces only
    if (!/^[A-Za-z\s]+$/.test(formData.full_name.trim())) {
      setMessageType("error");
      setMessage("Name should contain only letters and spaces");
      setLoading(false);
      return;
    }

    // Validate voter_id is 4 digits
    if (!/^\d{4}$/.test(formData.voter_id)) {
      setMessageType("error");
      setMessage("Voter ID must be exactly 4 digits");
      setLoading(false);
      return;
    }

    // Phone: exactly 10 digits
    const digitsOnlyPhone = (formData.phone_no || "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(digitsOnlyPhone)) {
      setMessageType("error");
      setMessage("Phone number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    // Email: restrict to allowed domains (gmail.com, outlook.com, or .ac.in)
    const allowedEmailRegex = /^[^\s@]+@(?:gmail\.com|outlook\.com|[A-Za-z0-9.-]+\.ac\.in)$/i;
    if (!allowedEmailRegex.test(formData.email)) {
      setMessageType("error");
      setMessage("Email must be from gmail.com, outlook.com, or an .ac.in domain");
      setLoading(false);
      return;
    }

    // Branch: ensure selection (we'll use dropdown)
    if (!formData.branch_name) {
      setMessageType("error");
      setMessage("Please select a branch");
      setLoading(false);
      return;
    }

    // Address fields validation
    const addr = formData.address || {};
    if (!addr.house_name || !addr.house_number || !addr.street_name || !addr.place) {
      setMessageType("error");
      setMessage("Please fill all address fields");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("full_name", formData.full_name);
      submitData.append("date_of_birth", formData.date_of_birth);
      submitData.append("address", JSON.stringify(formData.address));
      submitData.append("voter_id", formData.voter_id);
      submitData.append("email", formData.email);
      submitData.append("phone_no", formData.phone_no);
      submitData.append("branch_name", formData.branch_name);

      const response = await api.post("/add-voter", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.success) {
        setMessageType("success");
        setMessage("Voter added successfully!");

        // Reset form
        setFormData({
          full_name: "",
          date_of_birth: "",
          address: { house_name: "", house_number: "", street_name: "", place: "" },
          voter_id: "",
          email: "",
          phone_no: "",
          branch_name: "",
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 2000);
      }
    } catch (error) {
      setMessageType("error");
      const errorMessage = error.response?.data?.message || error.message || "Failed to add voter. Please try again.";
      console.error("Add voter error:", error);
      console.error("Error response:", error.response?.data);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin-dashboard");
  };

  // Normalize a header string for matching
  const normalizeKey = (key) => String(key).toLowerCase().replace(/[^a-z0-9]/g, "");

  // Map of normalized header variants -> form field
  const HEADER_MAP = {
    fullname: "full_name",
    full_name: "full_name",
    name: "full_name",
    dateofbirth: "date_of_birth",
    date_of_birth: "date_of_birth",
    dob: "date_of_birth",
    birthdate: "date_of_birth",
    voterid: "voter_id",
    voter_id: "voter_id",
    memberid: "voter_id",
    id: "voter_id",
    email: "email",
    emailaddress: "email",
    phoneno: "phone_no",
    phone_no: "phone_no",
    phone: "phone_no",
    phonenumber: "phone_no",
    mobile: "phone_no",
    mobilenumber: "phone_no",
    branchname: "branch_name",
    branch_name: "branch_name",
    branch: "branch_name",
    housename: "addr_house_name",
    house_name: "addr_house_name",
    housenumber: "addr_house_number",
    house_number: "addr_house_number",
    houseno: "addr_house_number",
    streetname: "addr_street_name",
    street_name: "addr_street_name",
    street: "addr_street_name",
    place: "addr_place",
    city: "addr_place",
    town: "addr_place",
  };

  const parseDateToISO = (raw) => {
    if (!raw) return "";
    // If it's a number (Excel serial date)
    if (typeof raw === "number") {
      const date = XLSX.SSF.parse_date_code(raw);
      if (date) {
        const y = date.y;
        const m = String(date.m).padStart(2, "0");
        const d = String(date.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
    const str = String(raw).trim();
    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    // Try YYYY-MM-DD already
    const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
    return str;
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setBulkResults(null);
    setBulkProgress(null);
    setMessage("");
    setExcelImporting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) {
        setMessageType("error");
        setMessage("Excel file must have a header row and at least one data row.");
        setExcelImporting(false);
        return;
      }

      const headers = rows[0].map((h) => normalizeKey(h));
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ""));

      if (dataRows.length === 0) {
        setMessageType("error");
        setMessage("No voter data rows found in the Excel file.");
        setExcelImporting(false);
        return;
      }

      const token = localStorage.getItem("token");
      const results = [];

      for (let i = 0; i < dataRows.length; i++) {
        const dataRow = dataRows[i];
        setBulkProgress({ done: i, total: dataRows.length });

        const extracted = {};
        headers.forEach((normHeader, idx) => {
          const field = HEADER_MAP[normHeader];
          if (field) {
            extracted[field] = dataRow[idx] !== undefined ? String(dataRow[idx]).trim() : "";
          }
        });

        // Parse date
        const dobIdx = headers.findIndex(h => HEADER_MAP[h] === "date_of_birth");
        if (dobIdx !== -1) extracted.date_of_birth = parseDateToISO(dataRow[dobIdx]);

        // Sanitize voter_id (digits only, max 4)
        if (extracted.voter_id) extracted.voter_id = extracted.voter_id.replace(/\D/g, "").slice(0, 4);
        // Sanitize phone (digits only, max 10)
        if (extracted.phone_no) extracted.phone_no = extracted.phone_no.replace(/\D/g, "").slice(0, 10);

        const voterName = extracted.full_name || `Row ${i + 2}`;
        const voterId = extracted.voter_id || "—";

        try {
          const submitData = new FormData();
          submitData.append("full_name", extracted.full_name || "");
          submitData.append("date_of_birth", extracted.date_of_birth || "");
          submitData.append("voter_id", extracted.voter_id || "");
          submitData.append("email", extracted.email || "");
          submitData.append("phone_no", extracted.phone_no || "");
          submitData.append("branch_name", extracted.branch_name || "");
          submitData.append("address", JSON.stringify({
            house_name: extracted.addr_house_name || "",
            house_number: extracted.addr_house_number || "",
            street_name: extracted.addr_street_name || "",
            place: extracted.addr_place || "",
          }));

          const res = await api.post("/add-voter", submitData, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
          });
          results.push({ name: voterName, voter_id: voterId, status: "success", msg: res.data.message || "Added" });
        } catch (err) {
          results.push({ name: voterName, voter_id: voterId, status: "error", msg: err.response?.data?.message || err.message || "Failed" });
        }
      }

      setBulkProgress({ done: dataRows.length, total: dataRows.length });
      setBulkResults(results);
    } catch (err) {
      setMessageType("error");
      setMessage("Failed to read Excel file. Make sure it is a valid .xlsx file.");
      console.error(err);
    } finally {
      setExcelImporting(false);
    }
  };

  return (
    <div className="add-voter-wrapper">
      <header className="add-voter-header">
        <div className="add-voter-header-inner">
          <h1 className="add-voter-title">ELECTRA</h1>
          <button className="btn-back" onClick={handleCancel}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="add-voter-main">
        <div className="add-voter-container">
          <h2 className="page-title">Add New Voter</h2>
          <p className="page-subtitle">Register a new bank member as a voter in the election system</p>

          <div className="voter-addition-methods">
            {/* Bulk Import Card */}
            <div
              className={`addition-card ${!showIndividualForm ? 'active' : ''}`}
              onClick={() => {
                if (showIndividualForm) {
                  setShowIndividualForm(false);
                  setMessage("");
                  setBulkResults(null);
                  setBulkProgress(null);
                }
              }}
            >
              <div className="excel-import-info">
                <span className="excel-icon">📊</span>
                <div>
                  <p className="excel-import-title">Bulk Import from Excel</p>
                  <p className="excel-import-desc">Upload a .xlsx file to add multiple voters at once.</p>
                </div>
              </div>
              {!showIndividualForm && (
                <div className="card-action-area">
                  <button
                    type="button"
                    className="btn-excel-import"
                    onClick={(e) => { e.stopPropagation(); excelFileRef.current?.click(); }}
                    disabled={excelImporting}
                  >
                    {excelImporting ? "⏳ Importing..." : "📂 Import from Excel"}
                  </button>
                  <input
                    ref={excelFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={handleExcelImport}
                  />
                </div>
              )}
            </div>

            {/* Individual Entry Card */}
            <div
              className={`addition-card ${showIndividualForm ? 'active' : ''}`}
              onClick={() => {
                if (!showIndividualForm) {
                  setShowIndividualForm(true);
                  setMessage("");
                  setBulkResults(null);
                  setBulkProgress(null);
                }
              }}
            >
              <div className="excel-import-info">
                <span className="excel-icon">👤</span>
                <div>
                  <p className="excel-import-title">Add Voter Individually</p>
                  <p className="excel-import-desc">Enter details manually for a single voter.</p>
                </div>
              </div>
              {showIndividualForm && (
                <div className="card-action-area">
                  <span className="active-indicator">Currently Editing</span>
                </div>
              )}
            </div>
          </div>

          {/* Bulk import progress */}
          {excelImporting && bulkProgress && (
            <div className="bulk-progress">
              <div className="bulk-progress-label">⏳ Adding voters... {bulkProgress.done} / {bulkProgress.total}</div>
              <div className="bulk-progress-bar">
                <div
                  className="bulk-progress-fill"
                  style={{ width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Bulk results table */}
          {bulkResults && (
            <div className="bulk-results">
              <div className="bulk-results-header">
                <span className="bulk-results-title">
                  ✅ {bulkResults.filter(r => r.status === "success").length} added &nbsp;|&nbsp;
                  {bulkResults.filter(r => r.status === "error").length > 0
                    ? `❌ ${bulkResults.filter(r => r.status === "error").length} failed`
                    : "0 failed"}
                  &nbsp;(out of {bulkResults.length} total)
                </span>
                <button className="bulk-results-clear" onClick={() => setBulkResults(null)}>✕ Clear</button>
              </div>
              <div className="bulk-results-table-wrap">
                <table className="bulk-results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Voter ID</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map((r, i) => (
                      <tr key={i} className={r.status === "success" ? "bulk-row--ok" : "bulk-row--err"}>
                        <td>{i + 1}</td>
                        <td>{r.name}</td>
                        <td>{r.voter_id}</td>
                        <td>{r.status === "success" ? `✅ ${r.msg}` : `❌ ${r.msg}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Normal form message */}
          {message && !bulkResults && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {/* Individual Form (Conditionally Rendered) */}
          {showIndividualForm && (
            <form className="add-voter-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="voter_id">Voter ID * (4 digits)</label>
                  <input
                    type="text"
                    id="voter_id"
                    name="voter_id"
                    value={formData.voter_id}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData(prev => ({ ...prev, voter_id: value }));
                    }}
                    placeholder="0000"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="voter@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date_of_birth">Date of Birth * (Must be 18+ years)</label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone_no">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone_no"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={(e) => {
                      // allow only digits and limit to 10
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData(prev => ({ ...prev, phone_no: digits }));
                    }}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="branch_name">Branch Name *</label>
                  <select
                    id="branch_name"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select branch</option>
                    <option value="Moonnilavu">Moonnilavu</option>
                    <option value="Mankomb">Mankomb</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.house_name">House Name *</label>
                  <input
                    type="text"
                    id="address.house_name"
                    name="address.house_name"
                    value={formData.address.house_name}
                    onChange={handleChange}
                    placeholder="Enter house name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.house_number">House Number *</label>
                  <input
                    type="text"
                    id="address.house_number"
                    name="address.house_number"
                    value={formData.address.house_number}
                    onChange={handleChange}
                    placeholder="Enter house number"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address.street_name">Street Name *</label>
                  <input
                    type="text"
                    id="address.street_name"
                    name="address.street_name"
                    value={formData.address.street_name}
                    onChange={handleChange}
                    placeholder="Enter street name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.place">Place *</label>
                  <select
                    id="address.place"
                    name="address.place"
                    value={formData.address.place}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select place</option>
                    <option value="Erumapra">Erumapra</option>
                    <option value="valakam">valakam</option>
                    <option value="mechal">mechal</option>
                    <option value="mangombu">mangombu</option>
                    <option value="moonnilavu">moonnilavu</option>
                    <option value="kalathukadavu">kalathukadavu</option>
                  </select>
                </div>
              </div>


              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Voter"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default AddVoter;

