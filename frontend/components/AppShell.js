"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getUser } from "../lib/auth";
import CustomerSidebar from "./CustomerSidebar";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/buy-data", label: "Buy Data" },
  { href: "/wallet-funding", label: "Fund Wallet" },
  { href: "/transactions", label: "Transactions" },
  { href: "/admin", label: "Admin" }
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

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
              src="/logo.jpg"
              alt="Prosperous TechPro logo"
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
        <main className="flex-1">{children}</main>
        <CustomerSidebar />
      </div>
    </div>
  );
}
