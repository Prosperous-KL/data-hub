"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";
import StatCard from "../../components/StatCard";
import { apiRequest } from "../../lib/api";

export default function DashboardPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [walletResponse, txResponse] = await Promise.all([
          apiRequest("/api/wallet/balance"),
          apiRequest("/api/transactions?limit=5")
        ]);

        setWallet(walletResponse?.wallet || null);
        setTransactions(Array.isArray(txResponse?.transactions) ? txResponse.transactions : []);
      } catch (requestError) {
        setError(requestError.message);
        setWallet(null);
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
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Dashboard</h2>

          <ErrorAlert message={error} />

          {loading && <LoadingState label="Loading wallet" />}

          {!loading && wallet && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Wallet Balance" value={`GHS ${Number(wallet.available_balance).toFixed(2)}`} tone="success" />
              <StatCard title="Locked Balance" value={`GHS ${Number(wallet.locked_balance).toFixed(2)}`} tone="info" />
              <StatCard title="Recent Transactions" value={String(transactions.length)} tone="warning" />
              <StatCard title="Wallet ID" value={String(wallet.id || "N/A").slice(0, 8)} tone="default" />
            </div>
          )}

          <section className="panel p-4">
            <h3 className="text-sm font-semibold text-slate-700">Latest Transactions</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-200">
                      <td className="py-2 pr-4 uppercase">{tx.type}</td>
                      <td className="py-2 pr-4">GHS {Number(tx.amount).toFixed(2)}</td>
                      <td className="py-2 pr-4">{tx.status}</td>
                      <td className="py-2 pr-4">{tx.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && transactions.length === 0 && <p className="py-3 text-sm text-slate-500">No transactions yet.</p>}
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
