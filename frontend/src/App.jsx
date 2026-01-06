import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import VoterDashboard from "./pages/VoterDashboard";
import SendNotification from "./pages/SendNotification";
import AddVoter from "./pages/AddVoter";
import ReportVoterError from "./pages/ReportVoterError";
import ViewVotersList from "./pages/ViewVotersList";
import CandidateApplication from "./pages/CandidateApplication";
import ElectionResults from "./pages/ElectionResults";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("userType");
    
    if (token && storedUserType) {
      setIsLoggedIn(true);
      setUserType(storedUserType);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (type) => {
    setIsLoggedIn(true);
    setUserType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("name");
    localStorage.removeItem("fullName");
    localStorage.removeItem("voterId");
    setIsLoggedIn(false);
    setUserType(null);
    window.location.href = "/login";
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white", fontSize: "18px" }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        
        {/* Protected Admin Dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            isLoggedIn && userType === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected Add Voter Page */}
        <Route 
          path="/add-voter" 
          element={
            isLoggedIn && userType === "admin" ? (
              <AddVoter />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected Voter Dashboard */}
        <Route 
          path="/voter-dashboard" 
          element={
            isLoggedIn && userType === "voter" ? (
              <VoterDashboard />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected Report Voter Error Page */}
        <Route 
          path="/report-voter-error" 
          element={
            isLoggedIn && userType === "voter" ? (
              <ReportVoterError />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected View Voters List Page (voter or admin) */}
        <Route 
          path="/voters-list" 
          element={
            isLoggedIn && (userType === "voter" || userType === "admin") ? (
              <ViewVotersList />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected Candidate Application Page */}
        <Route 
          path="/candidate-application" 
          element={
            isLoggedIn && userType === "voter" ? (
              <CandidateApplication />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Protected Election Results Page */}
        <Route 
          path="/election-results" 
          element={
            isLoggedIn && userType === "voter" ? (
              <ElectionResults />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Redirect from /dashboard to appropriate dashboard */}
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn ? (
              userType === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : (
                <Navigate to="/voter-dashboard" />
              )
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        {/* Admin Reports Page */}
        <Route
          path="/admin-reports"
          element={
            isLoggedIn && userType === "admin" ? (
              <AdminReports />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Send Notification Page */}
        <Route
          path="/send-notification"
          element={
            isLoggedIn && userType === "admin" ? (
              <SendNotification />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
