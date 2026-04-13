"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function BuyDataPage() {
  const [bundles, setBundles] = useState({});
  const [form, setForm] = useState({ network: "MTN", bundleCode: "", phoneNumber: "", momoNumber: "" });
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadBundles() {
      try {
        const response = await apiRequest("/api/data/bundles");
        setBundles(response.bundles || {});
        const first = response.bundles?.MTN?.[0]?.code || "";
        setForm((current) => ({ ...current, bundleCode: first }));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setBootLoading(false);
      }
    }

    loadBundles();
  }, []);

  const currentBundles = useMemo(() => bundles[form.network] || [], [bundles, form.network]);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    if (!isValidGhanaPhone(form.phoneNumber)) {
      setError("Enter a valid recipient Ghana phone number (e.g. 024xxxxxxx or +23324xxxxxxx).");
      setLoading(false);
      return;
    }

    if (!isValidGhanaPhone(form.momoNumber)) {
      setError("Enter a valid MoMo number to pay from (e.g. 024xxxxxxx or +23324xxxxxxx).");
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest("/api/data/buy", {
        method: "POST",
        headers: {
          "x-idempotency-key": crypto.randomUUID()
        },
        body: JSON.stringify(form)
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
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Buy Data Bundle</h2>
          <p className="mt-1 text-sm text-slate-600">Choose network, recipient number, and the payment number that will approve the transaction.</p>

          <ErrorAlert message={error} />
          {bootLoading && <LoadingState label="Loading bundles" />}

          {!bootLoading && (
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <select
                className="input"
                value={form.network}
                onChange={(event) => {
                  const network = event.target.value;
                  const nextBundle = bundles[network]?.[0]?.code || "";
                  setForm({ ...form, network, bundleCode: nextBundle });
                }}
              >
                <option value="MTN">MTN</option>
                <option value="TELECEL">Telecel</option>
                <option value="AIRTELTIGO">AirtelTigo</option>
              </select>

              <select className="input" value={form.bundleCode} onChange={(event) => setForm({ ...form, bundleCode: event.target.value })}>
                {currentBundles.map((bundle) => (
                  <option key={bundle.code} value={bundle.code}>
                    {bundle.volume} - GHS {bundle.amount}
                  </option>
                ))}
              </select>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recipient number
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Recipient phone number"
                  value={form.phoneNumber}
                  onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment number
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="MoMo number to pay from"
                  value={form.momoNumber}
                  onChange={(event) => setForm({ ...form, momoNumber: event.target.value })}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Processing..." : "Buy Data"}
              </button>
            </form>
          )}

          {result && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <p className="font-semibold">{result.message}</p>
              <p className="mt-1">Status: {result.status}</p>
              <p>Purchase ID: {result.purchaseId}</p>
              <p>Transaction ID: {result.transactionId}</p>
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
