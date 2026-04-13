"use client";

import Link from "next/link";
import { getUser } from "../lib/auth";

export default function CustomerSidebar() {
  const user = getUser();

  if (!user) {
    return null;
  }

  return (
    <aside className="w-full flex-shrink-0 md:w-64">
      <div className="panel animate-floatUp space-y-4 p-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer Profile</h3>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-4">
          <div>
            <p className="text-xs font-semibold text-slate-600">Username</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-900">
              {user.full_name || user.email?.split("@")[0] || "User"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600">Email</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-900">
              {user.email || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600">Phone Number</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-900">
              {user.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600">Account Role</p>
            <p className="mt-1 inline-block rounded-full bg-brand-sky/10 px-2 py-1 text-xs font-semibold capitalize text-brand-sky">
              {user.role || "user"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600">Member Since</p>
            <p className="mt-1 text-sm text-slate-700">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })
                : "Recently"}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <Link href="/change-username" className="block rounded-lg bg-brand-sky text-white px-3 py-2 text-xs font-semibold text-center hover:bg-brand-sky/90 transition">
            Change Username
          </Link>
          <Link href="/account-recovery" className="block rounded-lg bg-brand-sky text-white px-3 py-2 text-xs font-semibold text-center hover:bg-brand-sky/90 transition">
            Recovery Account
          </Link>
          <Link href="/delete-account" className="block rounded-lg bg-red-600 text-white px-3 py-2 text-xs font-semibold text-center hover:bg-red-700 transition">
            Delete Account
          </Link>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">
            Keep your account information up to date to ensure smooth transactions.
          </p>
        </div>
      </div>
    </aside>
  );
}
