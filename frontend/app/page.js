import Link from "next/link";

const services = [
  {
    title: "Instant Data Bundle Delivery",
    detail: "Customers buy MTN, Telecel, and AirtelTigo bundles with wallet-backed checkout."
  },
  {
    title: "MoMo Wallet Funding",
    detail: "Users fund wallets securely before checkout, with transaction status tracking."
  },
  {
    title: "Seller Tools",
    detail: "Business users can list products, track orders, and manage withdrawals."
  },
  {
    title: "Refund Workflow",
    detail: "Failed fulfillment cases are reviewed and refunded according to platform policy."
  }
];

const controls = [
  "Customer authentication with OTP and session protection",
  "Payment callback signature checks and idempotency protection",
  "Transaction logs, ledger records, and wallet balance traceability",
  "Admin review workflow for failed payments and refunds"
];

const steps = [
  "Create an account and verify your contact details",
  "Fund wallet using supported Mobile Money rails",
  "Buy data bundles and receive status updates instantly"
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-base font-black tracking-tight text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Prosperous Data Hub
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Home
            </Link>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Login
            </Link>
            <Link href="/register" className="rounded-lg border border-brand-ink bg-brand-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-900">
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-panel sm:p-10">
          <div className="absolute -left-16 -top-14 h-56 w-56 rounded-full bg-brand-sky/15 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
          <div className="relative max-w-3xl animate-floatUp">
            <div className="mb-6 flex justify-center">
              <img src="/prosperous-logo.png" alt="Prosperous TechPro Logo" className="h-24 sm:h-32 object-contain" />
            </div>
            <p className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Ghana Digital Services Platform
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-brand-ink sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              Prosperous Data Hub
            </h1>
            <h2 className="mt-3 text-lg font-semibold text-slate-700 sm:text-xl">
              Secure wallet-powered data and digital commerce for customers in Ghana
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Prosperous Data Hub provides internet bundle sales, wallet funding, and seller transaction tools. We use
              verification, payment callback controls, and auditable records to protect customers and maintain a
              transparent payment lifecycle.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Start Now
              </Link>
              <Link href="/register" className="btn-secondary">
                Create Account
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">Data Delivery</span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">Wallet Funding</span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">Refund Handling</span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">Audit Trail</span>
            </div>
          </div>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="about-title">
          <h3 id="about-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Business Overview
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Business Type</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">Digital services and VTU platform</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Primary Market</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">Retail and small business customers in Ghana</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Fulfillment Model</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">Automated digital delivery with manual exception handling</p>
            </article>
          </div>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="services-title">
          <h3 id="services-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Services
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <article key={service.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-bold text-slate-800 sm:text-base">{service.title}</h4>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">{service.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="how-title">
          <h3 id="how-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            How It Works
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-sky">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800 sm:text-base">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="controls-title">
          <h3 id="controls-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Security And Compliance Controls
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {controls.map((control) => (
              <li key={control} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                {control}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500 sm:text-sm">
            We do not process prohibited products or services. Transactions are monitored and exceptions are reviewed.
          </p>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="policy-title">
          <h3 id="policy-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Customer Policies
          </h3>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Before creating an account, customers can review our Terms, Privacy, and Refund policies.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/terms" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:border-brand-sky hover:text-brand-ink">
              Terms And Conditions
            </Link>
            <Link href="/privacy" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:border-brand-sky hover:text-brand-ink">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:border-brand-sky hover:text-brand-ink">
              Refund Policy
            </Link>
          </div>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="contact-title">
          <h3 id="contact-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Contact
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Phone</span>
              +233 248 699 146
            </p>
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Email</span>
              kwawulucky@gmail.com
            </p>
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Location</span>
              Ho, Ghana
            </p>
          </div>
        </section>

        <footer className="pb-3 text-center text-xs text-slate-500 sm:text-sm">
          © {new Date().getFullYear()} Prosperous Data Hub. All rights reserved.
        </footer>
      </main>
    </div>
  );
}