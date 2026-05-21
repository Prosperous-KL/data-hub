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
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
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
              name="amount"
              id="amount"
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
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900 shadow-sm animate-fadeIn">
              <p className="font-semibold text-base text-sky-900">{result.approvalMessage}</p>
              <div className="mt-2 space-y-1 text-slate-700">
                <p><span className="font-medium text-slate-900">Payment Reference:</span> <code className="bg-sky-100 px-1.5 py-0.5 rounded font-mono text-xs">{result.payment.external_reference}</code></p>
                {result.checkoutUrl && (
                  <div className="mt-4 pt-3 border-t border-sky-200">
                    <p className="text-sm text-slate-600 mb-3">
                      We are redirecting you to the secure checkout page. If you are not redirected automatically, please click the button below:
                    </p>
                    <a
                      href={result.checkoutUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-700 active:scale-95 transition-all duration-150"
                      target="_self"
                      rel="noopener noreferrer"
                    >
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>
                      </svg>
                      Go to Paystack Secure Checkout
                    </a>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-slate-500 border-t border-sky-100 pt-2">
                Simulate callback by sending /api/payment/callback with status SUCCESS and this reference.
              </p>
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
