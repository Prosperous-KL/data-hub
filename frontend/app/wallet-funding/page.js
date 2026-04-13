"use client";

import { useState } from "react";
import AppShell from "../../components/AppShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";
import { apiRequest } from "../../lib/api";

const ghPhoneRegex = /^(?:\+233|233|0)(?:2[03456789]|5\d)\d{7}$/;

function isValidGhanaPhone(value) {
  const normalized = String(value || "").replace(/[\s-]/g, "").trim();
  return ghPhoneRegex.test(normalized);
}

export default function WalletFundingPage() {
  const [form, setForm] = useState({ amount: "", momoNumber: "", provider: "MTN" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    if (!isValidGhanaPhone(form.momoNumber)) {
      setError("Enter a valid Ghana phone number to pay from (e.g. 024xxxxxxx or +23324xxxxxxx).");
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest("/api/payment/initiate", {
        method: "POST",
        headers: {
          "x-idempotency-key": crypto.randomUUID()
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          momoNumber: form.momoNumber,
          provider: form.provider
        })
      });
      setResult(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="panel max-w-2xl animate-floatUp p-5">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Initiate Mobile Money Funding</h2>
          <p className="mt-1 text-sm text-slate-600">Enter the mobile money number that will receive the payment prompt and approve the transfer.</p>

          <ErrorAlert message={error} />

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              className="input"
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount in GHS"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              required
            />

            <select className="input" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })}>
              <option value="MTN">MTN</option>
              <option value="TELECEL">Telecel</option>
              <option value="AIRTELTIGO">AirtelTigo</option>
            </select>

            <input
              className="input"
              type="text"
              placeholder="Number that will pay (MoMo)"
              value={form.momoNumber}
              onChange={(event) => setForm({ ...form, momoNumber: event.target.value })}
              required
            />

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Initiating..." : "Send Mobile Money Prompt"}
            </button>
          </form>

          {loading && <div className="mt-3"><LoadingState label="Contacting payment provider" /></div>}

          {result && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              <p className="font-semibold">{result.approvalMessage}</p>
              <p className="mt-1">Payment Reference: {result.payment.external_reference}</p>
              <p>Checkout URL: {result.checkoutUrl || "Provider direct push"}</p>
              <p className="mt-2 text-xs text-slate-600">
                Simulate callback by sending /api/payment/callback with status SUCCESS and this reference.
              </p>
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
