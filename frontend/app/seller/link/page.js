"use client";

import AppShell from "../../../components/AppShell";
import SellerNav from "../../../components/SellerNav";

export default function SellerLink() {
  const storeUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/store/your-store-slug`;
  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="md:col-span-1"><div className="panel p-4"><SellerNav current="/seller/link" /></div></aside>
        <main className="md:col-span-3"><div className="panel p-4"><h2 className="text-xl font-bold">Your Store Link</h2><p className="mt-2 text-sm text-slate-600">Share this URL with customers to view your storefront.</p><div className="mt-4 rounded border p-3 bg-slate-50"><code className="text-sm">{storeUrl}</code></div></div></main>
      </div>
    </AppShell>
  );
}
