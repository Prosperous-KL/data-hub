"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import PasswordField from "../../../components/PasswordField";
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
  const [googleSigninReady, setGoogleSigninReady] = useState(false);

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
          Verify with OTP sent to your email, phone, or social account before setting a new password.
        </p>

        <ErrorAlert message={error} />
        {message && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}

        <div className="mt-4 space-y-3">
          <div className="flex gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" name="recover-channel" checked={channel === "EMAIL"} onChange={() => setChannel("EMAIL")} />
              Email
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="recover-channel" checked={channel === "PHONE"} onChange={() => setChannel("PHONE")} />
              Phone
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="recover-channel" checked={channel === "WHATSAPP"} onChange={() => setChannel("WHATSAPP")} />
              WhatsApp
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="recover-channel" checked={channel === "SOCIAL"} onChange={() => setChannel("SOCIAL")} />
              Google
            </label>
          </div>

          {channel !== "SOCIAL" ? (
            <>
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
            </>
          ) : googleSigninReady ? (
            <div id="google-signin-button" style={{ justifyContent: "center", display: "flex", marginTop: "0.75rem" }} />
          ) : (
            <p className="text-sm text-slate-500">Loading Google Sign-In...</p>
          )}

          {otpSessionId && (
            <>
              <input
                className="input"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                maxLength={6}
                required
              />

              <PasswordField
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
                name="new-password"
              />
            </>
          )}
        </div>

        {devOtp && <p className="mt-2 text-xs text-slate-500">Dev OTP: {devOtp}</p>}

        {otpSessionId && (
          <button disabled={loading || !otpSessionId} className="btn-primary mt-4 w-full" type="submit">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        )}

        <p className="mt-4 text-sm text-slate-600">
          Back to <Link href="/login" className="font-semibold text-brand-sky hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
