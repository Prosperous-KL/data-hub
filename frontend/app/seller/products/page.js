"use client";

import AppShell from "../../../components/AppShell";
import SellerNav from "../../../components/SellerNav";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priceCents: "",
    currency: "GHS",
    stock: "0"
  });

  async function load() {
    try {
      const res = await apiRequest('/api/store/products');
      setProducts(res.products || []);
    } catch (e) {
      setProducts([]);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(product) {
    setEditingId(product.id);
    setMessage("");
    setForm({
      title: product.title || "",
      description: product.description || "",
      priceCents: String(product.price_cents ?? ""),
      currency: product.currency || "GHS",
      stock: String(product.stock ?? 0)
    });
  }

  function resetForm() {
    setEditingId("");
    setForm({ title: "", description: "", priceCents: "", currency: "GHS", stock: "0" });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      title: form.title,
      description: form.description,
      priceCents: Number(form.priceCents || 0),
      currency: form.currency,
      stock: Number(form.stock || 0)
    };

    try {
      if (editingId) {
        await apiRequest(`/api/store/products/${editingId}`, { method: "PUT", body: payload });
        setMessage("Product updated successfully.");
      } else {
        await apiRequest("/api/store/products", { method: "POST", body: payload });
        setMessage("Product created successfully.");
      }

      resetForm();
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="md:col-span-1">
          <div className="panel p-4"><SellerNav current="/seller/products" /></div>
        </aside>
        <main className="md:col-span-3">
          <div className="panel p-4">
            <h2 className="text-xl font-bold">Products</h2>
            <p className="mt-2 text-sm text-slate-600">Add, edit, or remove products for your store.</p>
            {message && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{message}</div>}

            <form onSubmit={saveProduct} className="mt-4 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Product name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <input className="input" placeholder="Price in pesewas" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: e.target.value })} required />
                <input className="input" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                <input className="input" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <textarea className="input min-h-28" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : editingId ? "Update Product" : "Create Product"}</button>
                {editingId && <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold" type="button" onClick={resetForm}>Cancel Edit</button>}
              </div>
            </form>

            <div className="mt-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500"><th>Name</th><th>Price</th><th>Stock</th><th></th></tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t border-slate-200">
                      <td className="py-2 pr-4">{p.title}</td>
                      <td className="py-2 pr-4">GHS {(Number(p.price_cents || 0) / 100).toFixed(2)}</td>
                      <td className="py-2 pr-4">{p.stock}</td>
                      <td className="py-2 pr-4"><button type="button" className="font-semibold text-brand-sky hover:underline" onClick={() => startEdit(p)}>Edit</button></td>
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
