"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import PasswordField from "@/components/PasswordField";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorAlert from "@/components/ErrorAlert";
import { apiRequest } from "@/lib/api";
import { clearSession, getUser } from "@/lib/auth";

export default function DeleteAccountPage() {
  const router = useRouter();
  const user = getUser();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [channel, setChannel] = useState("PHONE");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const confirmRequired = "DELETE MY ACCOUNT";
  const canDelete = password && confirmText === confirmRequired && otpSessionId && otpCode.length === 7;

  async function requestOtp() {
    setSendingOtp(true);
    setError("");
    setMessage("");

    try {
      const target = channel === "EMAIL" ? user?.email : user?.phone;
      if (!target) {
        throw new Error(`No ${channel === "EMAIL" ? "email" : "phone number"} found for this account`);
      }

      const response = await apiRequest("/api/auth/otp/request", {
        method: "POST",
        body: {
          purpose: "ACCOUNT_DELETE",
          channel,
          target
        }
      });

      setOtpSessionId(response.otpSessionId || "");
      setDevOtp(response.devOtp || "");
      setMessage(response.message || `Prosperous Data Hub Confirmation sent via ${response.deliveryMethod || "delivery"}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function deleteAccount() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/api/auth/account", {
        method: "DELETE",
        body: {
          password,
          otpSessionId,
          otpCode,
          channel
        }
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
                <label className="block text-xs font-semibold text-slate-600 mb-2">OTP Channel</label>
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delete-channel"
                      value="PHONE"
                      checked={channel === "PHONE"}
                      onChange={() => setChannel("PHONE")}
                      disabled={sendingOtp || loading}
                    />
                    Phone
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delete-channel"
                      value="EMAIL"
                      checked={channel === "EMAIL"}
                      onChange={() => setChannel("EMAIL")}
                      disabled={sendingOtp || loading}
                    />
                    Email
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={requestOtp}
                disabled={sendingOtp || loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {sendingOtp ? "Sending OTP..." : otpSessionId ? "Resend OTP" : "Send Delete OTP"}
              </button>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Enter OTP</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter P123456 code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
                  disabled={loading}
                  maxLength={7}
                />
                {devOtp && <p className="mt-1 text-xs text-slate-500">Dev OTP: {devOtp}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Enter your password
                </label>
                <PasswordField
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  name="delete-account-password"
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
