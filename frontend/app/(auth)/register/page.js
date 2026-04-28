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
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="panel w-full animate-floatUp p-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Create Account
        </h1>
        <p className="mt-1 text-sm text-slate-600">Register and start buying data bundles in Ghana.</p>

        <ErrorAlert message={error} />

        <div className="mt-4 space-y-3">
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" name="reg-channel" checked={channel === "PHONE"} onChange={() => setChannel("PHONE")} />
              Phone
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="reg-channel" checked={channel === "WHATSAPP"} onChange={() => setChannel("WHATSAPP")} />
              WhatsApp
            </label>
          </div>
          <input name="fullName" id="fullName" className="input" type="text" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          <input name="email" id="email" className="input" type="email" placeholder="Gmail address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <input name="phone" id="phone" className="input" type="text" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
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
        </div>

        <button disabled={loading} className="btn-primary mt-4 w-full" type="submit">
          {loading ? "Continuing..." : "Sign up"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-brand-sky hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
