import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getToken, getUser } from "./lib/auth";
import Navbar from "./components/Navbar";
import Homepage from "./pages/Homepage";
import ProtectedRoute from "./components/ProtectedRoute";

// Import existing auth and app components
// Adjust these imports based on your actual component locations
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";

function ProtectedRouteWrapper({ children, adminOnly = false }) {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      setReady(true);
      setIsAuthed(false);
      return;
    }

    if (adminOnly && user.role !== "admin") {
      setReady(true);
      setIsAuthed(false);
      return;
    }

    setReady(true);
    setIsAuthed(true);
  }, [adminOnly]);

  if (!ready) {
    return <p className="p-4 text-sm text-slate-500">Loading secure session...</p>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />

        {/* Auth Routes - Add your Login and Register components here */}
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> */}

        {/* Protected Routes - Wrap with ProtectedRouteWrapper */}
        {/* Example dashboard route - uncomment and adjust as needed */}
        {/* <Route
          path="/dashboard"
          element={
            <ProtectedRouteWrapper>
              <Dashboard />
            </ProtectedRouteWrapper>
          }
        />

        {/* Admin-only route example */}
        {/* <Route
          path="/admin"
          element={
            <ProtectedRouteWrapper adminOnly={true}>
              <AdminDashboard />
            </ProtectedRouteWrapper>
          }
        /> */}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
