import Link from "next/link";

const services = [
  "Buy MTN Data",
  "Buy Telecel Data",
  "Buy AirtelTigo Data",
  "Fund Wallet"
];

const steps = ["Create account", "Fund wallet", "Buy data instantly"];

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
            <p className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Ghana VTU Platform
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-brand-ink sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              Prosperous Data Hub
            </h1>
            <h2 className="mt-3 text-lg font-semibold text-slate-700 sm:text-xl">
              Buy affordable internet data bundles instantly in Ghana
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Prosperous Data Hub is a secure virtual top-up platform that lets individuals and businesses buy mobile
              internet bundles quickly, track every transaction, and manage wallet funding in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Get Started
              </Link>
              <Link href="/register" className="btn-secondary">
                Register
              </Link>
            </div>
          </div>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="about-title">
          <h3 id="about-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            About
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            We are a Ghana-based VTU business focused on reliable and transparent data delivery. Our goal is to make
            purchasing internet bundles simple, fast, and affordable for customers across the country.
          </p>
        </section>

        <section className="panel p-6 sm:p-8" aria-labelledby="services-title">
          <h3 id="services-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Services
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <article key={service} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-bold text-slate-800 sm:text-base">{service}</h4>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Instant processing with wallet-backed payment flow.</p>
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

        <section className="panel p-6 sm:p-8" aria-labelledby="contact-title">
          <h3 id="contact-title" className="text-2xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Contact
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Phone</span>
              +233 XX XXX XXXX
            </p>
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Email</span>
              support@prosperousdatahub.com
            </p>
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Location</span>
              Ghana
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}