"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import PasswordField from "../../../components/PasswordField";
import { apiRequest } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
  const [googleSigninReady, setGoogleSigninReady] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        router.push("/login");
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  // Load Google Sign-In script
  useEffect(() => {
    const handleGoogleSignIn = (event) => {
      const response = event.detail;
      if (response?.credential) {
        processGoogleToken(response.credential);
      }
    };

    window.addEventListener("google-signin", handleGoogleSignIn);

    if (window.google?.accounts?.id) {
      setGoogleSigninReady(true);
      initializeGoogleSignIn();
      return () => window.removeEventListener("google-signin", handleGoogleSignIn);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      setGoogleSigninReady(true);
      initializeGoogleSignIn();
    };
    document.body.appendChild(script);

    return () => window.removeEventListener("google-signin", handleGoogleSignIn);
  }, []);

  function initializeGoogleSignIn() {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        callback: (response) => processGoogleToken(response.credential)
      });
      const btn = document.getElementById("google-signin-button");
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin"
        });
      }
    }
  }

  async function processGoogleToken(token) {
    setSendingOtp(true);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest("/api/auth/social/google/recovery/request", {
        method: "POST",
        body: { idToken: token }
      });

      setOtpSessionId(result.otpSessionId || "");
      setDevOtp(result.devOtp || "");
      setMessage(result.message || "Google account verified. Confirmation code sent to your email.");
      setChannel("EMAIL");
      setIdentifier(result.social?.email || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function requestOtp(event) {
    event.preventDefault();
    if (channel === "SOCIAL") {
      return; // Google button handles SOCIAL flow
    }

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
      await apiRequest("/api/auth/password-recovery/reset", {
        method: "POST",
        body: {
          identifier,
          otpSessionId,
          otpCode,
          newPassword
        }
      });

      setMessage("Password reset successful! Redirecting to login in 3 seconds...");
      setOtpCode("");
      setNewPassword("");
      setCountdown(3);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-brand-sky/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-brand-gold/20 blur-3xl" />
      </div>

      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur md:grid-cols-2">
        {/* Info panel */}
        <section className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-ink via-slate-900 to-slate-800" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(2,132,199,0.45),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(217,119,6,0.28),transparent_40%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Prosperous Data Hub
              </p>
              <h2 className="mt-6 max-w-sm text-4xl font-black leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                Recover your account access.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-slate-200">
                Follow the quick OTP verification steps to reset your password and regain access to your dashboard.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Multiple recovery methods: Email, Phone, WhatsApp, or Google.</p>
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Quick password update and instant login session redirection.</p>
            </div>
          </div>
        </section>

        {/* Form panel */}
        <section className="p-6 sm:p-8 md:p-10">
          <form onSubmit={resetPassword} className="mx-auto w-full max-w-md animate-floatUp">
            <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Verify with OTP sent to your email, phone, or social account before setting a new password.
            </p>

            <ErrorAlert message={error} />
            {message && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 font-medium">Select verification channel</label>
                <div className="flex flex-wrap gap-3 text-sm mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input type="radio" name="recover-channel" checked={channel === "EMAIL"} onChange={() => setChannel("EMAIL")} className="text-brand-sky focus:ring-brand-sky" />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input type="radio" name="recover-channel" checked={channel === "PHONE"} onChange={() => setChannel("PHONE")} className="text-brand-sky focus:ring-brand-sky" />
                    Phone SMS
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input type="radio" name="recover-channel" checked={channel === "WHATSAPP"} onChange={() => setChannel("WHATSAPP")} className="text-brand-sky focus:ring-brand-sky" />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input type="radio" name="recover-channel" checked={channel === "SOCIAL"} onChange={() => setChannel("SOCIAL")} className="text-brand-sky focus:ring-brand-sky" />
                    Google
                  </label>
                </div>
              </div>

              {channel !== "SOCIAL" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {channel === "EMAIL" ? "Gmail Address" : "Phone Number"}
                    </label>
                    <input
                      className="input"
                      type={channel === "EMAIL" ? "email" : "text"}
                      placeholder={channel === "EMAIL" ? "you@example.com" : "e.g. 024XXXXXXX"}
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      required
                    />
                  </div>

                  <button type="button" onClick={requestOtp} className="btn-primary w-full py-2.5 text-sm font-bold" disabled={sendingOtp}>
                    {sendingOtp ? "Sending OTP..." : otpSessionId ? "Resend OTP" : "Send OTP"}
                  </button>
                </>
              ) : googleSigninReady ? (
                <div id="google-signin-button" style={{ justifyContent: "center", display: "flex", marginTop: "0.75rem" }} />
              ) : (
                <p className="text-sm text-slate-500">Loading Google Sign-In...</p>
              )}

              {devOtp && (
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800">
                  <strong>Development Mode:</strong> Your OTP code is <code className="bg-sky-100 px-1.5 py-0.5 rounded font-mono font-bold text-sm">{devOtp}</code>
                </div>
              )}

              {otpSessionId && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Verification Code</label>
                    <input
                      className="input text-center text-lg font-bold tracking-widest"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">New Password (min 8 characters)</label>
                    <PasswordField
                      placeholder="New password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={8}
                      required
                      name="new-password"
                    />
                  </div>
                </>
              )}
            </div>

            {otpSessionId && (
              <button disabled={loading || !otpSessionId} className="btn-primary mt-6 w-full py-3 text-sm font-bold" type="submit">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              Back to{" "}
              <Link href="/login" className="font-bold text-brand-sky hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
