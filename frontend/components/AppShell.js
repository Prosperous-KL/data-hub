"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearSession, getUser } from "../lib/auth";
import CustomerSidebar from "./CustomerSidebar";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/buy-data", label: "Buy Data" },
  { href: "/wallet-funding", label: "Fund Wallet" },
  { href: "/transactions", label: "Transactions" },
  { href: "/seller", label: "Seller" },
  { href: "/admin", label: "Admin" }
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="panel mb-6 animate-floatUp px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/ProsperousLogo.png"
              alt="Prosperous Data Hub logo"
              width={56}
              height={56}
              className="rounded-lg border border-slate-200 object-cover"
              priority
            />
            <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Prosperous Data Hub
            </h1>
            <p className="text-sm text-slate-600">Ghana VTU Portal for instant internet data delivery</p>
            </div>
          </div>
          <div className="text-sm text-slate-700">
            <div>{user?.full_name || user?.email || "User"}</div>
            <button onClick={() => setMobileProfileOpen(true)} className="mt-1 block text-xs font-semibold text-slate-700 underline md:hidden">
              Open Profile
            </button>
            <button onClick={logout} className="text-xs font-semibold text-brand-sky hover:underline">
              Logout
            </button>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2">
          {links
            .filter((link) => (user?.role === "admin" ? true : link.href !== "/admin"))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pathname === link.href ? "bg-brand-ink text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
        </nav>
      </header>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="hidden md:block">
          <CustomerSidebar />
        </div>
        <main className="flex-1">{children}</main>
      </div>

      {mobileProfileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close profile panel"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileProfileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-sm overflow-y-auto bg-white p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-800">Customer Profile</h2>
              <button
                type="button"
                onClick={() => setMobileProfileOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
            <CustomerSidebar />
          </div>
        </div>
      )}
    </div>
  );
}
