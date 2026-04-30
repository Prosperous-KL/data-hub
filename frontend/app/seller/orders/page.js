"use client";

import AppShell from "../../../components/AppShell";
import SellerNav from "../../../components/SellerNav";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [network, setNetwork] = useState("ALL");
  const [form, setForm] = useState({ phone: "", product: "", paidCents: "", profitCents: "0", network: "MTN", status: "PAID" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      if (network) qs.set("network", network);
      const [ordersResponse, productsResponse] = await Promise.all([
        apiRequest(`/api/store/orders?${qs.toString()}`),
        apiRequest("/api/store/products?limit=200")
      ]);

      setOrders(ordersResponse.orders || []);
      setProducts(productsResponse.products || []);
      if (!form.product && (productsResponse.products || []).length > 0) {
        setForm((current) => ({ ...current, product: productsResponse.products[0].title }));
      }
    } catch (e) {
      setOrders([]);
      setProducts([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createOrder(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        phone: form.phone,
        product: form.product,
        paidCents: Number(form.paidCents || 0),
        profitCents: Number(form.profitCents || 0),
        network: form.network,
        status: form.status
      };

      await apiRequest("/api/store/orders", {
        method: "POST",
        body: payload
      });

      setMessage("Order created successfully.");
      setForm((current) => ({ ...current, phone: "", paidCents: "", profitCents: "0" }));
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="md:col-span-1"><div className="panel p-4"><SellerNav current="/seller/orders" /></div></aside>
        <main className="md:col-span-3">
          <div className="panel p-4">
            <h2 className="text-xl font-bold">My Orders</h2>
            <p className="mt-2 text-sm text-slate-600">Search phone or order ref, filter by status and network, or create a new order.</p>

            {message && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{message}</div>}

            <form onSubmit={createOrder} className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input className="input" placeholder="Customer phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                <select className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
                  {products.length === 0 ? <option value="">No products available</option> : null}
                  {products.map((product) => (
                    <option key={product.id} value={product.title}>
                      {product.title}
                    </option>
                  ))}
                </select>
                <input className="input" placeholder="Paid in pesewas" value={form.paidCents} onChange={(e) => setForm({ ...form, paidCents: e.target.value })} required />
                <input className="input" placeholder="Profit in pesewas" value={form.profitCents} onChange={(e) => setForm({ ...form, profitCents: e.target.value })} />
                <select className="input" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                  <option value="MTN">MTN</option>
                  <option value="TELECEL">Telecel</option>
                  <option value="AIRTELTIGO">AirtelTigo</option>
                </select>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="FULFILLED">Fulfilled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Creating..." : "Create Order"}</button>
                <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold" type="button" onClick={() => setForm((current) => ({ ...current, phone: "", paidCents: "", profitCents: "0" }))}>
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <input className="input" placeholder="Search phone or order ref" value={q} onChange={(e)=>setQ(e.target.value)} />
              <select className="input" value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
              <select className="input" value={network} onChange={(e)=>setNetwork(e.target.value)}>
                <option value="ALL">All Networks</option>
                <option value="MTN">MTN</option>
                <option value="AIRTELTIGO">AirtelTigo</option>
                <option value="TELECEL">Telecel</option>
              </select>
              <button className="btn-primary" onClick={load} disabled={loading}>{loading?"Loading...":"Filter"}</button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2 pr-4">Order</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Product</th>
                    <th className="pb-2 pr-4">Paid</th>
                    <th className="pb-2 pr-4">Profit</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-slate-200">
                      <td className="py-2 pr-4">{o.order_ref || o.id}</td>
                      <td className="py-2 pr-4">{o.phone}</td>
                      <td className="py-2 pr-4">{o.product}</td>
                      <td className="py-2 pr-4">GHS {(Number(o.paid_cents || o.amount_cents || 0)/100).toFixed(2)}</td>
                      <td className="py-2 pr-4">GHS {(o.profit_cents/100).toFixed(2)}</td>
                      <td className="py-2 pr-4">{o.status}</td>
                      <td className="py-2 pr-4">{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
