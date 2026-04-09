"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorAlert from "../../../components/ErrorAlert";
import LoadingState from "../../../components/LoadingState";
import { apiRequest } from "../../../lib/api";
import { saveSession } from "../../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form)
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

        <div className="mt-4 space-y-3">
          <input className="input" type="text" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <input className="input" type="text" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
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
