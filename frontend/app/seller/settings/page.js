"use client";

import AppShell from "../../../components/AppShell";
import SellerNav from "../../../components/SellerNav";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";

export default function SellerSettings() {
  const [settings, setSettings] = useState({ seller_id: "", shop_name: "", open: true, closed_notice: "", support_contact: "", community_link: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await apiRequest('/api/store/settings');
      setSettings({
        seller_id: res.settings?.seller_id || "",
        shop_name: res.settings?.shop_name || "",
        open: typeof res.settings?.open === "boolean" ? res.settings.open : true,
        closed_notice: res.settings?.closed_notice || "",
        support_contact: res.settings?.support_contact || "",
        community_link: res.settings?.community_link || ""
      });
    } catch (e) {}
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest('/api/store/settings', { method: 'POST', body: settings });
      setSettings({
        seller_id: res.settings?.seller_id || settings.seller_id,
        shop_name: res.settings?.shop_name || settings.shop_name,
        open: typeof res.settings?.open === "boolean" ? res.settings.open : settings.open,
        closed_notice: res.settings?.closed_notice || settings.closed_notice,
        support_contact: res.settings?.support_contact || settings.support_contact,
        community_link: res.settings?.community_link || settings.community_link
      });
    } catch (err) {
    } finally { setLoading(false); }
  }

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-4">
        <aside className="md:col-span-1"><div className="panel p-4"><SellerNav current="/seller/settings" /></div></aside>
        <main className="md:col-span-3">
          <div className="panel p-4">
            <h2 className="text-xl font-bold">Store Settings</h2>
            <p className="mt-2 text-sm text-slate-600">Control how your store appears to customers and how they can reach you.</p>

            <form onSubmit={save} className="mt-4 grid gap-3 max-w-2xl">
              <label className="text-xs text-slate-500">Shop Name</label>
              <input className="input" value={settings.shop_name} onChange={(e)=>setSettings({...settings, shop_name: e.target.value})} />

              <label className="text-xs text-slate-500">Store Open</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.open} onChange={(e)=>setSettings({...settings, open: e.target.checked})} /> Open</label>
              </div>

              <label className="text-xs text-slate-500">Closed Notice</label>
              <input className="input" value={settings.closed_notice} onChange={(e)=>setSettings({...settings, closed_notice: e.target.value})} />

              <label className="text-xs text-slate-500">Support Contact</label>
              <input className="input" value={settings.support_contact} onChange={(e)=>setSettings({...settings, support_contact: e.target.value})} />

              <label className="text-xs text-slate-500">Community Link</label>
              <input className="input" value={settings.community_link} onChange={(e)=>setSettings({...settings, community_link: e.target.value})} />

              <button className="btn-primary" disabled={loading}>{loading?"Saving...":"Save Settings"}</button>
            </form>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
