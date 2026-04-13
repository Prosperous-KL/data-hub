"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorAlert from "@/components/ErrorAlert";
import { apiRequest } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const confirmRequired = "DELETE MY ACCOUNT";
  const canDelete = password && confirmText === confirmRequired;

  async function deleteAccount() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/api/auth/account", {
        method: "DELETE",
        body: { password }
      });

      setMessage("Account deleted successfully. Logging out...");
      setTimeout(() => {
        clearSession();
        router.replace("/login");
      }, 2000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto w-full max-w-md">
          <div className="panel animate-floatUp space-y-6 p-6">
            <div>
              <h1 className="text-2xl font-bold text-red-600" style={{ fontFamily: "var(--font-heading)" }}>
                Delete Account
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                This action cannot be undone
              </p>
            </div>

            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-red-900">⚠️ Warning</p>
              <li className="text-xs text-red-800 list-inside list-disc">Your account will be permanently deleted</li>
              <li className="text-xs text-red-800 list-inside list-disc">All your data, transactions, and wallet will be removed</li>
              <li className="text-xs text-red-800 list-inside list-disc">This action cannot be reversed</li>
            </div>

            <ErrorAlert message={error} />

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Enter your password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Type "{confirmRequired}" to confirm
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder={confirmRequired}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                onClick={deleteAccount}
                disabled={loading || !canDelete}
                className="w-full rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? "Deleting Account..." : "Permanently Delete Account"}
              </button>

              <Link href="/dashboard" className="block text-center text-xs text-brand-sky hover:underline">
                Cancel & Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
