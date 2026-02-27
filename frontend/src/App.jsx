import { useState, useEffect, Component } from "react";
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
import AdminVotersList from "./pages/AdminVotersList";
import CandidateApplication from "./pages/CandidateApplication";
import ElectionResults from "./pages/ElectionResults";
import AdminVoting from "./pages/AdminVoting";
import Notifications from "./pages/Notifications";
import AdminCandidateApplications from "./pages/AdminCandidateApplications";
import AdminNominationPortal from "./pages/AdminNominationPortal";
import VotingPage from "./pages/VotingPage";
import "./App.css";

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong on this page.</div>
          <div style={{ marginTop: 8, color: "#b00020" }}>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    window.location.href = "/";
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

        {/* Protected View Voters List Page (voter) */}
        <Route
          path="/voters-list"
          element={
            isLoggedIn && userType === "voter" ? (
              <PageErrorBoundary>
                <ViewVotersList />
              </PageErrorBoundary>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected View Voters List Page (admin) */}
        <Route
          path="/admin-voters-list"
          element={
            isLoggedIn && userType === "admin" ? (
              <PageErrorBoundary>
                <AdminVotersList />
              </PageErrorBoundary>
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

        <Route
          path="/admin-candidate-applications"
          element={
            isLoggedIn && userType === "admin" ? (
              <AdminCandidateApplications />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin-nomination-portal"
          element={
            isLoggedIn && userType === "admin" ? (
              <AdminNominationPortal />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Voting Booth */}
        <Route
          path="/vote"
          element={
            isLoggedIn && userType === "voter" ? (
              <VotingPage />
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

        <Route
          path="/notifications"
          element={
            isLoggedIn && userType === "voter" ? (
              <Notifications />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin-voting"
          element={
            isLoggedIn && userType === "admin" ? (
              <AdminVoting />
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

        <Route path="/voters%20list" element={<Navigate to="/voters-list" replace />} />
        <Route path="/admin%20voters%20list" element={<Navigate to="/admin-voters-list" replace />} />
        <Route path="/adminvoterslist" element={<Navigate to="/admin-voters-list" replace />} />

        <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
