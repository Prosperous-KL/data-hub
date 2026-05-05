import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../lib/auth";

export default function ProtectedRoute({ children, adminOnly = false }) {
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
