"use client";

import Link from "next/link";
import { useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import { apiRequest } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");

  async function requestOtp(event) {
    event.preventDefault();
    setSendingOtp(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/api/auth/password-recovery/request", {
        method: "POST",
        body: {
          identifier,
          channel
        }
      });

      setOtpSessionId(response.otpSessionId || "");
      setDevOtp(response.devOtp || "");
      setMessage(response.message || "OTP sent successfully");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
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
          newPassword
        }
      });

      setMessage(response.message || "Password reset successful");
      setOtpCode("");
      setNewPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={resetPassword} className="panel w-full animate-floatUp p-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Reset Password
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Verify with OTP sent to your email or phone before setting a new password.
        </p>

        <ErrorAlert message={error} />
        {message && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}

        <div className="mt-4 space-y-3">
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" checked={channel === "EMAIL"} onChange={() => setChannel("EMAIL")} />
              Email
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={channel === "PHONE"} onChange={() => setChannel("PHONE")} />
              Phone
            </label>
          </div>

          <input
            className="input"
            type={channel === "EMAIL" ? "email" : "text"}
            placeholder={channel === "EMAIL" ? "you@example.com" : "Phone number"}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />

          <button type="button" onClick={requestOtp} className="btn-primary w-full" disabled={sendingOtp}>
            {sendingOtp ? "Sending OTP..." : otpSessionId ? "Resend OTP" : "Send OTP"}
          </button>

          <input
            className="input"
            type="text"
            placeholder="OTP code"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value)}
            maxLength={6}
            required
          />

          <input
            className="input"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        {devOtp && <p className="mt-2 text-xs text-slate-500">Dev OTP: {devOtp}</p>}

        <button disabled={loading || !otpSessionId} className="btn-primary mt-4 w-full" type="submit">
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          Back to <Link href="/login" className="font-semibold text-brand-sky hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
