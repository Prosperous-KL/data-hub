"use client";

import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto w-full max-w-2xl">
          <div className="panel animate-floatUp p-6">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Personal preferences and app options.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-slate-800">Account Actions</h2>
              <p className="mt-1 text-sm text-slate-600">
                Account actions are available directly from the sidebar for faster access.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
