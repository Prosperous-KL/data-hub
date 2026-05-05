export const metadata = {
  title: "Terms And Conditions | Prosperous Data Hub"
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6">
      <section className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Terms And Conditions
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">Last updated: May 5, 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 sm:text-base">
          <p>
            Prosperous Data Hub provides digital services including internet bundle purchases, wallet funding, and related
            account features. By using the platform, you agree to these terms.
          </p>

          <div>
            <h2 className="text-base font-bold text-slate-900">Account And Eligibility</h2>
            <p className="mt-2">
              You must provide accurate registration information and keep your login credentials secure. Accounts may be
              suspended for fraud, abuse, or policy violations.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Payments And Wallet Usage</h2>
            <p className="mt-2">
              Wallet funding and purchases are subject to payment verification and transaction risk checks. We may delay
              or reject transactions that fail validation or appear suspicious.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Prohibited Activities</h2>
            <p className="mt-2">
              You may not use this platform for illegal or prohibited activities, including money laundering, fraud,
              identity theft, or restricted digital goods.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Service Availability</h2>
            <p className="mt-2">
              While we target high uptime, third-party provider downtime may affect service. We will provide incident
              updates and support remediation when required.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Contact</h2>
            <p className="mt-2">For terms questions, contact support@prosperousdatahub.com.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
