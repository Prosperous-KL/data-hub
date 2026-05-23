"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ErrorAlert from "../../../../components/ErrorAlert";
import LoadingState from "../../../../components/LoadingState";
import { apiRequest } from "../../../../lib/api";
import { saveSession } from "../../../../lib/auth";

function maskPhone(phone) {
  const value = String(phone || "").replace(/\s+/g, "");
  if (value.length < 4) {
    return value;
  }
  return `${value.slice(0, 4)}****${value.slice(-3)}`;
}

export default function RegisterVerifyPage() {
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const maskedPhone = useMemo(() => maskPhone(pending?.phone), [pending]);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingRegistration");
    if (!raw) {
      router.replace("/register");
      return;
    }

    try {
      const payload = JSON.parse(raw);
      if (!payload?.fullName || !payload?.email || !payload?.phone || !payload?.password) {
        sessionStorage.removeItem("pendingRegistration");
        router.replace("/register");
        return;
      }
      setPending(payload);
    } catch {
      sessionStorage.removeItem("pendingRegistration");
      router.replace("/register");
    }
  }, [router]);

  useEffect(() => {
    if (!pending || otpSessionId) {
      return;
    }

    const ch = pending.channel || "PHONE";
    void requestOtp(pending.phone, ch);
  }, [pending, otpSessionId]);

  async function requestOtp(phone) {
    setSendingOtp(true);
    setError("");

    try {
      const response = await apiRequest("/api/auth/otp/request", {
        method: "POST",
        body: {
          purpose: "REGISTER",
          channel: arguments[1] || "PHONE",
          target: phone
        }
      });

      setOtpSessionId(response.otpSessionId || "");
      setDevOtp(response.devOtp || "");
      setMessage(response.message || "Confirmation code sent via SMS.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!pending) {
      router.replace("/register");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          ...pending,
          otpSessionId,
          otpCode
        }
      });

      sessionStorage.removeItem("pendingRegistration");
      saveSession(response.accessToken, response.user, response.refreshToken);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!pending) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="panel w-full p-6 text-center">
          <LoadingState label="Preparing verification" />
        </div>
      </div>
    );
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
                Protecting your account security.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-slate-200">
                We verify every registration phone number to make sure your wallet payments and data orders remain secure.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">One-time passcodes expire after 10 minutes.</p>
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Make sure your phone number can receive messages.</p>
            </div>
          </div>
        </section>

        {/* Form panel */}
        <section className="p-6 sm:p-8 md:p-10">
          <form onSubmit={onSubmit} className="mx-auto w-full max-w-md animate-floatUp">
            <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
              Verify Your Phone
            </h1>
            {sendingOtp && !otpSessionId ? (
              <p className="mt-1 text-sm text-slate-600">Sending confirmation code to {maskedPhone}...</p>
            ) : otpSessionId ? (
              <p className="mt-1 text-sm text-slate-600">We sent a confirmation code to {maskedPhone}.</p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">We could not send a confirmation code yet. Check your number and try again.</p>
            )}

            <ErrorAlert message={error} />
            {message && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Verification Code</label>
                <input
                  name="otp"
                  id="otp"
                  className="input text-center text-lg font-bold tracking-widest"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => requestOtp(pending.phone, pending.channel)}
                className="btn-outline w-full py-2.5 text-sm"
                disabled={sendingOtp}
              >
                {sendingOtp ? "Resending..." : "Resend code"}
              </button>

              {devOtp && (
                <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800">
                  <strong>Development Mode:</strong> Your OTP code is <code className="bg-sky-100 px-1.5 py-0.5 rounded font-mono font-bold text-sm">{devOtp}</code>
                </div>
              )}
            </div>

            <button
              disabled={loading || (!otpSessionId && !devOtp)}
              className="btn-primary mt-6 w-full py-3 text-sm font-bold"
              type="submit"
            >
              {loading ? "Creating account..." : "Verify and create account"}
            </button>

            {loading && (
              <div className="mt-3">
                <LoadingState label="Creating profile" />
              </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              Wrong number?{" "}
              <Link href="/register" className="font-bold text-brand-sky hover:underline">
                Go back
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
