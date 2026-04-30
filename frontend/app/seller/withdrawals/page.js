"use client";

import AppShell from "../../../components/AppShell";
import SellerNav from "../../../components/SellerNav";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";

export default function SellerWithdrawals() {
  const [availableBalance, setAvailableBalance] = useState(1200); // cents
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [momoNumber, setMomoNumber] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    try {
      const res = await apiRequest('/api/store/withdrawals');
      setHistory(res.withdrawals || []);
    } catch (e) {
      setHistory([]);
    }
  }

  useEffect(() => { loadHistory(); }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const cents = Math.round(Number(amount) * 100);
      await apiRequest('/api/store/withdrawals', { method: 'POST', body: { amountCents: cents, network, momoNumber } });
      setAmount("");
      setMomoNumber("");
      await loadHistory();
    } catch (err) {
      // show error
    } finally { setLoading(false); }
  }

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="md:col-span-1"><div className="panel p-4"><SellerNav current="/seller/withdrawals" /></div></aside>
        <main className="md:col-span-3">
          <div className="panel p-4">
            <h2 className="text-xl font-bold">Withdraw Funds</h2>
            <p className="mt-2 text-sm text-slate-600">Request payouts and check withdrawal history.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Available Balance</div>
                <div className="text-3xl font-bold">GHS {(availableBalance/100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Withdrawable</div>
                <div className="text-2xl">GHS {(availableBalance/100).toFixed(2)}</div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-4 grid gap-3">
              <label className="text-xs text-slate-500">Amount (₵)</label>
              <input className="input" placeholder="Enter amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />
              <div className="text-xs text-slate-400">Min ₵1 — Max ₵{(availableBalance/100).toFixed(2)}</div>

              <label className="text-xs text-slate-500">Network</label>
              <select className="input" value={network} onChange={(e)=>setNetwork(e.target.value)}>
                <option>MTN</option>
                <option>AIRTELTIGO</option>
                <option>TELECEL</option>
              </select>

              <label className="text-xs text-slate-500">MoMo Number</label>
              <input className="input" placeholder="054XXXXXXXX" value={momoNumber} onChange={(e)=>setMomoNumber(e.target.value)} />

              <button className="btn-primary" disabled={loading}>{loading?"Requesting...":"Request Withdrawal"}</button>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-semibold">Withdrawal History</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-slate-500"><th>Amount</th><th>Network</th><th>Phone</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} className="border-t border-slate-200"><td className="py-2 pr-4">GHS {(h.amount_cents/100).toFixed(2)}</td><td className="py-2 pr-4">{h.network}</td><td className="py-2 pr-4">{h.momo_number}</td><td className="py-2 pr-4">{h.status}</td><td className="py-2 pr-4">{new Date(h.created_at).toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
