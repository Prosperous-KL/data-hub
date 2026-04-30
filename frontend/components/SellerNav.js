"use client";

import Link from "next/link";

export default function SellerNav({ current = "/seller" }) {
  const items = [
    { href: "/seller", label: "Overview" },
    { href: "/seller/products", label: "Products" },
    { href: "/seller/orders", label: "Orders" },
    { href: "/seller/withdrawals", label: "Withdrawals" },
    { href: "/seller/settings", label: "Settings" },
    { href: "/seller/link", label: "Your Store Link" }
  ];

  return (
    <nav className="space-y-2">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={`block rounded px-3 py-2 text-sm font-semibold ${current === it.href ? "bg-brand-ink text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
