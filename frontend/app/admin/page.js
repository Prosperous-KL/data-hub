"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/LoadingState";
import { apiRequest } from "../../lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [failedTransactions, setFailedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refundForm, setRefundForm] = useState({ transactionId: "", reason: "" });
  const [refundMessage, setRefundMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, failedResponse] = await Promise.all([
        apiRequest("/api/admin/users?limit=500"),
        apiRequest("/api/admin/transactions/failed?limit=100")
      ]);
      setUsers(Array.isArray(usersResponse?.users) ? usersResponse.users : []);
      setFailedTransactions(Array.isArray(failedResponse?.transactions) ? failedResponse.transactions : []);
    } catch (requestError) {
      setError(requestError.message);
      setUsers([]);
      setFailedTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const refreshInterval = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, []);

  async function submitRefund(event) {
    event.preventDefault();
    setRefundMessage("");
    setError("");

    try {
      const response = await apiRequest("/api/admin/refund", {
        method: "POST",
        body: JSON.stringify(refundForm)
      });
      const txId = response?.refund?.transaction?.id || "N/A";
      setRefundMessage(`Refund posted. Transaction: ${txId}`);
      setRefundForm({ transactionId: "", reason: "" });
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <AppShell>
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Admin Dashboard</h2>

          <ErrorAlert message={error} />
          {loading && <LoadingState label="Loading admin data" />}

          {refundMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{refundMessage}</div>
          )}

          <section className="panel p-4">
            <h3 className="text-sm font-semibold text-slate-700">Manual Refund</h3>
            <form onSubmit={submitRefund} className="mt-3 grid gap-2 sm:grid-cols-3">
              <input
                name="transactionId"
                id="transactionId"
                className="input sm:col-span-1"
                placeholder="Transaction ID"
                value={refundForm.transactionId}
                onChange={(event) => setRefundForm({ ...refundForm, transactionId: event.target.value })}
                required
              />
              <input
                name="reason"
                id="reason"
                className="input sm:col-span-1"
                placeholder="Reason"
                value={refundForm.reason}
                onChange={(event) => setRefundForm({ ...refundForm, reason: event.target.value })}
                required
              />
              <button className="btn-primary sm:col-span-1" type="submit">
                Trigger Refund
              </button>
            </form>
          </section>

          <section className="panel p-4">
            <h3 className="text-sm font-semibold text-slate-700">Customer Records ({users.length})</h3>
            <p className="mt-1 text-xs text-slate-500">Customer identity, wallet balance, transaction count, and account role.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Wallet Balance</th>
                    <th className="pb-2 pr-4">Transactions</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-200">
                      <td className="py-2 pr-4">{user.full_name}</td>
                      <td className="py-2 pr-4">{user.email}</td>
                      <td className="py-2 pr-4">{user.phone}</td>
                      <td className="py-2 pr-4">GHS {Number(user.wallet_balance || 0).toFixed(2)}</td>
                      <td className="py-2 pr-4">{Number(user.transaction_count || 0)}</td>
                      <td className="py-2 pr-4">{user.role}</td>
                      <td className="py-2 pr-4">{user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-4">
            <h3 className="text-sm font-semibold text-slate-700">Failed or Refunded Transactions ({failedTransactions.length})</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 pr-4">ID</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {failedTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-slate-200">
                      <td className="py-2 pr-4">{tx.id}</td>
                      <td className="py-2 pr-4">{tx.user_id}</td>
                      <td className="py-2 pr-4">GHS {Number(tx.amount).toFixed(2)}</td>
                      <td className="py-2 pr-4">{tx.status}</td>
                      <td className="py-2 pr-4">{tx.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
