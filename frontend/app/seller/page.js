"use client";

import AppShell from "../../components/AppShell";
import SellerNav from "../../components/SellerNav";

export default function SellerOverview() {
  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="md:col-span-1">
          <div className="panel p-4">
            <SellerNav current="/seller" />
          </div>
        </aside>
        <main className="md:col-span-3">
          <div className="panel p-4">
            <h2 className="text-xl font-bold">Seller Overview</h2>
            <p className="mt-2 text-sm text-slate-600">Quick stats: total sales, earnings, pending orders, and store views (coming soon).</p>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
