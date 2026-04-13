"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import LoadingState from "../../../components/LoadingState";
import PasswordField from "../../../components/PasswordField";
import { apiRequest } from "../../../lib/api";
import { saveSession } from "../../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: form
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
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-brand-sky/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-brand-gold/20 blur-3xl" />
      </div>

      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur md:grid-cols-2">
        <section className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-ink via-slate-900 to-slate-800" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(2,132,199,0.45),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(217,119,6,0.28),transparent_40%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Prosperous Data Hub
              </p>
              <h2 className="mt-6 max-w-sm text-4xl font-black leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                Fast VTU, secure wallet, effortless top-ups.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-slate-200">
                Manage your airtime and data purchases in one dashboard with real-time transaction tracking.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Bank-level security for every payment callback.</p>
              <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">Track failed and successful orders instantly.</p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 md:p-10">
          <form onSubmit={onSubmit} className="mx-auto w-full max-w-md animate-floatUp">
            <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
              Welcome to Prosperous Data Hub
            </h1>
            <div className="mt-3">
              <Image
                src="/logo.jpg"
                alt="Prosperous TechPro logo"
                width={120}
                height={120}
                className="rounded-xl border border-slate-200 object-cover"
                priority
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue buying internet bundles instantly.
            </p>

            <ErrorAlert message={error} />

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-brand-sky hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordField
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="current-password"
                  required
                  name="login-password"
                />
              </div>
            </div>

            <button disabled={loading} className="btn-primary mt-6 w-full py-3 text-sm font-bold" type="submit">
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {loading && (
              <div className="mt-3">
                <LoadingState label="Authenticating" />
              </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              Need an account?{" "}
              <Link href="/register" className="font-bold text-brand-sky hover:underline">
                Register
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
