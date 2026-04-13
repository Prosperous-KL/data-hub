"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { apiRequest } from "../lib/api";
import { getUser, saveSession } from "../lib/auth";

export default function ChangeUsernamePage() {
  const router = useRouter();
  const user = getUser();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setIsInitialized(true);
    }
  }, [user]);

  async function handleUpdateUsername(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!fullName.trim()) {
        throw new Error("Username cannot be empty");
      }

      if (fullName.trim().length < 2) {
        throw new Error("Username must be at least 2 characters");
      }

      const response = await apiRequest("/api/auth/username", {
        method: "PUT",
        body: { fullName: fullName.trim() }
      });

      // Update local session with new username
      if (response.user) {
        saveSession(localStorage.getItem("prosperous_token"), {
          ...user,
          full_name: response.user.full_name
        });
      }

      setMessage("Username updated successfully!");
      setTimeout(() => router.replace("/dashboard"), 2000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isInitialized) {
    return (
      <ProtectedRoute>
        <AppShell>
          <LoadingState label="Loading profile..." />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto w-full max-w-md">
          <div className="panel animate-floatUp space-y-6 p-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                Change Username
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Update your display name
              </p>
            </div>

            <ErrorAlert message={error} />

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                ✓ {message}
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  New Username
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your new username"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  minLength="2"
                  maxLength="100"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Minimum 2 characters
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || fullName.trim() === user?.full_name}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Username"}
                </button>

                <Link href="/dashboard" className="block text-center text-xs text-brand-sky hover:underline">
                  Cancel & Return to Dashboard
                </Link>
              </div>
            </form>

            <div className="border-t border-slate-200 pt-4 text-center">
              <p className="text-xs text-slate-500">
                Current username: <strong>{user?.full_name || "Not set"}</strong>
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
