"use client";

import { useEffect, useState } from "react";
import { getToken, getUser } from "../lib/auth";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let token = null;
    let user = null;

    try {
      token = getToken();
      user = getUser();
    } catch {
      window.location.replace("/login");
      return;
    }

    if (!token || !user) {
      window.location.replace("/login");
      return;
    }

    if (adminOnly && user.role !== "admin") {
      window.location.replace("/dashboard");
      return;
    }

    setReady(true);
  }, [adminOnly]);

  if (!ready) {
    return <p className="p-4 text-sm text-slate-500">Loading secure session...</p>;
  }

  return children;
}
