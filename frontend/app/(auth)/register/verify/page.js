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

    void requestOtp(pending.phone);
  }, [pending, otpSessionId]);

  async function requestOtp(phone) {
    setSendingOtp(true);
    setError("");

    try {
      const response = await apiRequest("/api/auth/otp/request", {
        method: "POST",
        body: {
          purpose: "REGISTER",
          channel: "PHONE",
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
      saveSession(response.token, response.user);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!pending) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="panel w-full p-6">
          <LoadingState label="Preparing verification" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="panel w-full animate-floatUp p-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
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

        <div className="mt-4 space-y-3">
          <input
            className="input"
            type="text"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            maxLength={6}
            required
          />

          <button
            type="button"
            onClick={() => requestOtp(pending.phone)}
            className="btn-outline w-full"
            disabled={sendingOtp}
          >
            {sendingOtp ? "Resending..." : "Resend code"}
          </button>

          {devOtp && <p className="text-xs text-slate-500">Dev OTP: {devOtp}</p>}
        </div>

        <button
          disabled={loading || (!otpSessionId && !devOtp)}
          className="btn-primary mt-4 w-full"
          type="submit"
        >
          {loading ? "Creating account..." : "Verify and create account"}
        </button>

        {loading && (
          <div className="mt-3">
            <LoadingState label="Creating profile" />
          </div>
        )}

        <p className="mt-4 text-sm text-slate-600">
          Wrong number? <Link href="/register" className="font-semibold text-brand-sky hover:underline">Go back</Link>
        </p>
      </form>
    </div>
  );
}
