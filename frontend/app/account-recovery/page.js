"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorAlert from "@/components/ErrorAlert";
import LoadingState from "@/components/LoadingState";
import { apiRequest } from "@/lib/api";

export default function AccountRecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState("identify"); // identify, verify, confirm
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestRecoveryOtp() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!identifier) {
        throw new Error("Please enter your email or phone number");
      }

      const response = await apiRequest("/api/auth/password-recovery/request", {
        method: "POST",
        body: {
          identifier,
          channel
        }
      });

      setOtpSessionId(response.otpSessionId || "");
      setDevOtp(response.devOtp || "");
      setMessage(response.message || `Prosperous Data Hub Confirmation sent via ${response.deliveryMethod || "delivery"}.`);
      setStep("verify");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmRecovery() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/api/auth/password-recovery/reset", {
        method: "POST",
        body: {
          identifier,
          otpSessionId,
          otpCode,
          newPassword: "TempPass123!" // Or generate a random one
        }
      });

      setMessage("Account recovered! A temporary password has been sent to you.");
      setStep("confirm");
      setTimeout(() => router.replace("/login"), 3000);
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
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                Account Recovery
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Recover your account access using OTP verification
              </p>
            </div>

            <ErrorAlert message={error} />

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {step === "identify" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Verification Channel
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="channel"
                        value="EMAIL"
                        checked={channel === "EMAIL"}
                        onChange={() => setChannel("EMAIL")}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="channel"
                        value="PHONE"
                        checked={channel === "PHONE"}
                        onChange={() => setChannel("PHONE")}
                      />
                      Phone
                    </label>
                  </div>
                </div>

                <div>
                  <input
                    className="input"
                    type="text"
                    placeholder={channel === "EMAIL" ? "Enter your email" : "Enter your phone number"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={requestRecoveryOtp}
                  disabled={loading || !identifier}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "Sending OTP..." : "Send Recovery OTP"}
                </button>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-600">OTP sent to</p>
                  <p className="text-sm font-medium text-slate-900">{identifier}</p>
                </div>

                {devOtp && process.env.NODE_ENV !== "production" && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                    <p className="text-xs text-blue-600">Dev OTP: <strong>{devOtp}</strong></p>
                  </div>
                )}

                <div>
                  <input
                    className="input text-center"
                    type="text"
                    placeholder="Enter P123456 code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
                    maxLength="7"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={confirmRecovery}
                  disabled={loading || otpCode.length !== 7}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Recover"}
                </button>

                <button
                  onClick={() => {
                    setStep("identify");
                    setOtpCode("");
                    setOtpSessionId("");
                  }}
                  className="btn-ghost w-full text-sm"
                >
                  Back
                </button>
              </div>
            )}

            {step === "confirm" && (
              <div className="text-center space-y-4">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-sm text-emerald-700">✓ Account recovered successfully!</p>
                  <p className="text-xs text-emerald-600 mt-2">Redirecting to login...</p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <Link href="/dashboard" className="text-xs text-brand-sky hover:underline">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
