import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    photo: null,
    fingerprint_template: null
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const [fingerprintStatus, setFingerprintStatus] = useState("not_captured"); // not_captured, capturing, captured, error
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [scannerConnected, setScannerConnected] = useState(false);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "admin") {
      navigate("/admin-dashboard");
      return;
    }
    
    // Check scanner connection status
    checkScannerConnection();
  }, [navigate]);

  const checkScannerConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/check-scanner", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.connected) {
        setScannerConnected(true);
      } else {
        setScannerConnected(false);
      }
    } catch (error) {
      setScannerConnected(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files && files[0]) {
      const file = files[0];
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessageType("error");
        setMessage("Please select a valid image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessageType("error");
        setMessage("Image size should be less than 5MB");
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      // Support nested address fields named like address.house_name
      if (name.startsWith("address.")) {
        const field = name.split(".")[1];
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [field]: value
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleCaptureFingerprint = async () => {
    setFingerprintStatus("capturing");
    setMessage("");
    
    try {
      // Always use backend API for fingerprint capture
      const token = localStorage.getItem("token");
      const response = await api.post("/capture-fingerprint", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.template) {
        setFormData(prev => ({
          ...prev,
          fingerprint_template: response.data.template
        }));
        setFingerprintStatus("captured");
        
        // Check if it's test mode
        const isTestMode = response.data.test_mode || response.data.message?.includes("test") || response.data.message?.includes("mock");
        
        if (isTestMode) {
          setMessageType("success");
          setMessage("⚠️ TEST MODE: Mock fingerprint template generated. Place your finger on scanner for visual confirmation, but actual scan requires Mantra SDK.");
        } else {
          setMessageType("success");
          setMessage("✓ Fingerprint captured successfully!");
        }
        setScannerConnected(true);
      } else {
        throw new Error(response.data.message || "Failed to capture fingerprint");
      }
    } catch (error) {
      setFingerprintStatus("error");
      setMessageType("error");
      const errorMsg = error.response?.data?.message || error.message || "Failed to capture fingerprint. Please ensure Mantra MFS 100 is connected.";
      setMessage(errorMsg);
      setScannerConnected(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Validation
    // Required fields
    if (!formData.full_name || !formData.date_of_birth || !formData.voter_id || !formData.email || !formData.phone_no || !formData.branch_name || !formData.photo || !formData.fingerprint_template) {
      setMessageType("error");
      setMessage("Please fill in all required fields including photo and fingerprint");
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
      // send address as JSON string
      submitData.append("address", JSON.stringify(formData.address));
      submitData.append("voter_id", formData.voter_id);
      submitData.append("email", formData.email);
      submitData.append("phone_no", formData.phone_no);
      submitData.append("branch_name", formData.branch_name);
      submitData.append("photo", formData.photo);
      submitData.append("fingerprint_template", JSON.stringify(formData.fingerprint_template));
      
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
          address: "",
          voter_id: "",
          email: "",
          phone_no: "",
          branch_name: "",
          photo: null,
          fingerprint_template: null
        });
        setPhotoPreview(null);
        setFingerprintStatus("not_captured");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

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

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

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
                <label htmlFor="photo">Photo *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handleChange}
                  required
                  className="file-input"
                />
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Fingerprint *</label>
                <div className="fingerprint-section">
                  {!scannerConnected && (
                    <div className="scanner-status">
                      <p className="scanner-warning">⚠️ Scanner Status: Not Connected</p>
                      <button
                        type="button"
                        className="btn-check-scanner"
                        onClick={checkScannerConnection}
                      >
                        Check Connection
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className={`btn-fingerprint ${fingerprintStatus === "captured" ? "captured" : ""} ${!scannerConnected ? "disabled" : ""}`}
                    onClick={handleCaptureFingerprint}
                    disabled={fingerprintStatus === "capturing" || !scannerConnected}
                  >
                    {fingerprintStatus === "not_captured" && "📱 Capture Fingerprint"}
                    {fingerprintStatus === "capturing" && "⏳ Capturing..."}
                    {fingerprintStatus === "captured" && "✓ Template Generated (Test Mode)"}
                    {fingerprintStatus === "error" && "❌ Retry Capture"}
                  </button>
                  {fingerprintStatus === "error" && (
                    <p className="fingerprint-error">
                      {message || "Please ensure Mantra MFS 100 is connected and drivers are installed"}
                    </p>
                  )}
                  {scannerConnected && fingerprintStatus === "not_captured" && (
                    <div>
                      <p className="scanner-success">✓ Scanner is connected</p>
                      <p className="scanner-warning-text">⚠️ Currently in TEST MODE - generates mock template (MFS100 SDK not available)</p>
                    </div>
                  )}
                  {fingerprintStatus === "captured" && (
                    <p className="scanner-warning-text">
                      ⚠️ This is a TEST template. For real fingerprint capture, Mantra MFS100 SDK is required.
                    </p>
                  )}
                </div>
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
        </div>
      </main>
    </div>
  );
}

export default AddVoter;

