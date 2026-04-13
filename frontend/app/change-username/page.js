"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingState from "@/components/LoadingState";
import { apiRequest } from "@/lib/api";
import { getUser, saveSession } from "@/lib/auth";

export default function ChangeUsernamePage() {
  const router = useRouter();
  const user = getUser();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken', 'error'

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setUsername(user.username || "");
      setIsInitialized(true);
    }
  }, [user]);

  // Debounced username availability check
  useEffect(() => {
    const checkTimer = setTimeout(() => {
      if (username && username !== user?.username && username.length >= 3) {
        checkUsernameAvailability(username);
      } else if (username === user?.username) {
        setUsernameStatus(null);
      } else if (username.length > 0 && username.length < 3) {
        setUsernameStatus("error");
      }
    }, 500);

    return () => clearTimeout(checkTimer);
  }, [username, user?.username]);

  async function checkUsernameAvailability(usernameToCheck) {
    setCheckingUsername(true);
    setUsernameStatus("checking");

    try {
      const response = await apiRequest("/api/auth/username/check", {
        method: "GET",
        query: { username: usernameToCheck }
      });

      if (response.available) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus("taken");
      }
    } catch (err) {
      setUsernameStatus("error");
      console.error("Username check error:", err);
    } finally {
      setCheckingUsername(false);
    }
  }

  async function handleUpdateUsername(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Validate display name
      if (!fullName.trim()) {
        throw new Error("Display name cannot be empty");
      }

      if (fullName.trim().length < 2) {
        throw new Error("Display name must be at least 2 characters");
      }

      if (fullName.trim().length > 120) {
        throw new Error("Display name must not exceed 120 characters");
      }

      // Validate username
      if (!username.trim()) {
        throw new Error("Username cannot be empty");
      }

      if (username.trim().length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      if (username.trim().length > 50) {
        throw new Error("Username must not exceed 50 characters");
      }

      if (!/^[a-z0-9._-]+$/i.test(username.trim())) {
        throw new Error("Username can only contain lowercase letters, numbers, dots, hyphens, and underscores");
      }

      if (usernameStatus === "taken") {
        throw new Error("This username is already taken. Please choose another one.");
      }

      const response = await apiRequest("/api/auth/username", {
        method: "PUT",
        body: {
          username: username.trim().toLowerCase(),
          fullName: fullName.trim()
        }
      });

      // Update local session with new username data
      if (response.user) {
        saveSession(localStorage.getItem("prosperous_token"), {
          ...user,
          full_name: response.user.full_name,
          username: response.user.username
        });
      }

      setMessage("Username updated successfully! Redirecting to dashboard...");
      setTimeout(() => router.replace("/dashboard"), 2000);
    } catch (requestError) {
      setError(requestError.message || "Failed to update username. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getUsernameStatusIcon() {
    if (usernameStatus === "checking") {
      return <span className="inline-block text-blue-500">⟳ Checking...</span>;
    }
    if (usernameStatus === "available") {
      return <span className="inline-block text-emerald-500">✓ Available</span>;
    }
    if (usernameStatus === "taken") {
      return <span className="inline-block text-red-500">✗ Taken</span>;
    }
    if (usernameStatus === "error") {
      return <span className="inline-block text-orange-500">! Too short</span>;
    }
    return null;
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

  const isFormValid = 
    username.trim() &&
    fullName.trim() &&
    username.trim().length >= 3 &&
    fullName.trim().length >= 2 &&
    /^[a-z0-9._-]+$/i.test(username.trim()) &&
    (usernameStatus === "available" || username === user?.username) &&
    (fullName !== user?.full_name || username !== user?.username);

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
                Update your unique handle and display name
              </p>
            </div>

            <ErrorAlert message={error} />

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                ✓ {message}
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="space-y-5">
              {/* Username Handle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Username Handle
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    className={`input ${
                      usernameStatus === "available" ? "border-emerald-300 bg-emerald-50" : ""
                    } ${
                      usernameStatus === "taken" ? "border-red-300 bg-red-50" : ""
                    }`}
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    disabled={loading}
                    minLength="3"
                    maxLength="50"
                    required
                  />
                  {username && username !== user?.username && (
                    <div className="absolute right-3 top-3 flex items-center">
                      {checkingUsername ? (
                        <span className="text-blue-500 text-sm">⟳</span>
                      ) : usernameStatus === "available" ? (
                        <span className="text-emerald-500 text-lg">✓</span>
                      ) : usernameStatus === "taken" ? (
                        <span className="text-red-500 text-lg">✗</span>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    3-50 characters: letters, numbers, dots, hyphens, underscores
                  </p>
                  {getUsernameStatusIcon() && (
                    <div className="text-xs ml-2">{getUsernameStatusIcon()}</div>
                  )}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Display Name
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Your Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  minLength="2"
                  maxLength="120"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  2-120 characters (your public display name)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update Username"}
                </button>

                <Link
                  href="/dashboard"
                  className="block text-center text-xs text-brand-sky hover:underline py-2"
                >
                  Cancel & Return to Dashboard
                </Link>
              </div>
            </form>

            {/* Current Info */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Current Username:</span>
                <strong className="text-slate-900">@{user?.username || "Not set"}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Current Display:</span>
                <strong className="text-slate-900">{user?.full_name || "Not set"}</strong>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>💡 Tip:</strong> Your username is your unique handle (used for @mentions),
                while your display name is how others see you in the app. Make sure to choose 
                a username that's easy to remember and represents you well!
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
