"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import PasswordField from "../../../components/PasswordField";

const ghPhoneRegex = /^(?:\+233|233|0)(?:2[03456789]|5\d)\d{7}$/;

function isValidGhanaPhone(value) {
  const normalized = String(value || "").replace(/[\s-]/g, "").trim();
  return ghPhoneRegex.test(normalized);
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [channel, setChannel] = useState("PHONE");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!isValidGhanaPhone(form.phone)) {
      setError("Enter a valid Ghana phone number before creating account.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      setLoading(false);
      return;
    }

    try {
      sessionStorage.setItem("pendingRegistration", JSON.stringify({ ...form, channel }));
      router.push("/register/verify");
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
                Start your journey with us today.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-slate-200">
                Create an account to access the cheapest data bundles and airtime top-ups in Ghana, backed by instant delivery.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Quick 2-minute registration and immediate setup.</p>
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Secure OTP verification via SMS or WhatsApp.</p>
            </div>
          </div>
        </section>

        {/* Form panel */}
        <section className="p-6 sm:p-8 md:p-10">
          <form onSubmit={onSubmit} className="mx-auto w-full max-w-md animate-floatUp">
            <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
              Create Account
            </h1>
            <p className="mt-1 text-sm text-slate-600">Register and start buying data bundles in Ghana.</p>

            <ErrorAlert message={error} />

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">OTP delivery channel</label>
                <div className="flex gap-4 text-sm mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input type="radio" name="reg-channel" checked={channel === "PHONE"} onChange={() => setChannel("PHONE")} className="text-brand-sky focus:ring-brand-sky" />
                    Phone SMS
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input type="radio" name="reg-channel" checked={channel === "WHATSAPP"} onChange={() => setChannel("WHATSAPP")} className="text-brand-sky focus:ring-brand-sky" />
                    WhatsApp
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
                <input name="fullName" id="fullName" className="input" type="text" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email address</label>
                <input name="email" id="email" className="input" type="email" placeholder="Gmail address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Ghana phone number</label>
                <input name="phone" id="phone" className="input" type="text" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Password (min 8 characters)</label>
                <PasswordField
                  placeholder="Password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                  name="register-password"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm password</label>
                <PasswordField
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  name="register-confirm-password"
                />
              </div>
            </div>

            <button disabled={loading} className="btn-primary mt-6 w-full py-3 text-sm font-bold" type="submit">
              {loading ? "Continuing..." : "Sign up"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
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
