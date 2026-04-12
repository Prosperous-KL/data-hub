"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";
import { apiRequest } from "../../lib/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest("/api/transactions?limit=200");
        setTransactions(Array.isArray(response?.transactions) ? response.transactions : []);
      } catch (requestError) {
        setError(requestError.message);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <section className="panel animate-floatUp p-5">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Transaction History</h2>
          <p className="mt-1 text-sm text-slate-600">Track all wallet, payment, and bundle transactions.</p>

          <ErrorAlert message={error} />
          {loading && <LoadingState label="Loading transactions" />}

          {!loading && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Reference</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4">{tx.reference}</td>
                      <td className="py-2 pr-4 uppercase">{tx.type}</td>
                      <td className="py-2 pr-4">GHS {Number(tx.amount).toFixed(2)}</td>
                      <td className="py-2 pr-4">{tx.status}</td>
                      <td className="py-2 pr-4">{tx.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <p className="py-3 text-sm text-slate-500">No transactions found.</p>}
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
