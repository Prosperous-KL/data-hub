"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import LoadingState from "../../../components/LoadingState";
import PasswordField from "../../../components/PasswordField";
import { apiRequest } from "../../../lib/api";
import { saveSession } from "../../../lib/auth";

const ghPhoneRegex = /^(?:\+233|233|0)(?:2[03456789]|5\d)\d{7}$/;

function isValidGhanaPhone(value) {
  const normalized = String(value || "").replace(/[\s-]/g, "").trim();
  return ghPhoneRegex.test(normalized);
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationChannel, setVerificationChannel] = useState("PHONE");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [message, setMessage] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setSendingOtp(true);
    setError("");
    setMessage("");

    const target = verificationChannel === "EMAIL" ? form.email : form.phone;
    if (!target) {
      setError(`Enter your ${verificationChannel === "EMAIL" ? "email" : "phone number"} first.`);
      setSendingOtp(false);
      return;
    }

    if (verificationChannel === "PHONE" && !isValidGhanaPhone(form.phone)) {
      setError("Enter a valid Ghana phone number (e.g. 024xxxxxxx or +23324xxxxxxx).");
      setSendingOtp(false);
      return;
    }

    try {
      const response = await apiRequest("/api/auth/otp/request", {
        method: "POST",
        body: {
          purpose: "REGISTER",
          channel: verificationChannel,
          target
        }
      });

      setOtpSessionId(response.otpSessionId || "");
      setDevOtp(response.devOtp || "");
      setMessage(`OTP sent to ${response.target || target}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!otpSessionId) {
      setError("Request an OTP first.");
      setLoading(false);
      return;
    }

    if (!isValidGhanaPhone(form.phone)) {
      setError("Enter a valid Ghana phone number before creating account.");
      setLoading(false);
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          ...form,
          otpSessionId,
          otpCode
        }
      });
      saveSession(response.token, response.user);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="panel w-full animate-floatUp p-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Create Account
        </h1>
        <p className="mt-1 text-sm text-slate-600">Register and start buying data bundles in Ghana.</p>

        <ErrorAlert message={error} />
        {message && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}

        <div className="mt-4 space-y-3">
          <input className="input" type="text" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          <input className="input" type="email" placeholder="Email (optional)" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="input" type="text" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
          <PasswordField
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
            name="register-password"
          />
          <PasswordField
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            name="register-confirm-password"
          />

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">OTP verification</p>
            <div className="mb-2 flex gap-3 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="verification-channel"
                  value="EMAIL"
                  checked={verificationChannel === "EMAIL"}
                  onChange={() => setVerificationChannel("EMAIL")}
                />
                Email
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="verification-channel"
                  value="PHONE"
                  checked={verificationChannel === "PHONE"}
                  onChange={() => setVerificationChannel("PHONE")}
                />
                Phone
              </label>
            </div>

            <button type="button" onClick={sendOtp} className="btn-primary w-full" disabled={sendingOtp}>
              {sendingOtp ? "Sending OTP..." : otpSessionId ? "Resend OTP" : "Send OTP"}
            </button>

            <input
              className="input mt-2"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              maxLength={6}
              required
            />

            {devOtp && <p className="mt-2 text-xs text-slate-500">Dev OTP: {devOtp}</p>}
          </div>
        </div>

        <button disabled={loading} className="btn-primary mt-4 w-full" type="submit">
          {loading ? "Creating account..." : "Register"}
        </button>

        {loading && <div className="mt-3"><LoadingState label="Creating profile" /></div>}

        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-brand-sky hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
