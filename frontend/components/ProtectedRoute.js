"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "../lib/auth";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (adminOnly && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    setReady(true);
  }, [router, adminOnly]);

  if (!ready) {
    return <p className="p-4 text-sm text-slate-500">Loading secure session...</p>;
  }

  return children;
}
