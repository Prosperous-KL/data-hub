"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

const actions = [
  {
    href: "/change-username",
    title: "Change Username",
    description: "Update how your name appears in the app.",
    className: "bg-brand-sky text-white hover:bg-brand-sky/90"
  },
  {
    href: "/account-recovery",
    title: "Account Recovery",
    description: "Recover access using OTP sent to your email or phone.",
    className: "bg-slate-800 text-white hover:bg-slate-900"
  },
  {
    href: "/delete-account",
    title: "Delete Account",
    description: "Permanently remove your account and data.",
    className: "bg-red-600 text-white hover:bg-red-700"
  }
];

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
              Account updates and security actions.
            </p>

            <div className="mt-6 space-y-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{action.title}</h2>
                      <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                    </div>
                    <span className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${action.className}`}>
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
