export const metadata = {
  title: "Refund Policy | Prosperous Data Hub"
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6">
      <section className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Refund Policy
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">Last updated: May 5, 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 sm:text-base">
          <p>
            Prosperous Data Hub reviews all refund requests for failed or incomplete services according to transaction
            evidence and provider responses.
          </p>

          <div>
            <h2 className="text-base font-bold text-slate-900">Eligible Cases</h2>
            <p className="mt-2">
              Refunds are typically considered when payment succeeds but data fulfillment fails, or when duplicate charge
              events are verified.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Non-Eligible Cases</h2>
            <p className="mt-2">
              Successfully delivered purchases and user-input errors outside our control may not qualify for refunds.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Review Timeline</h2>
            <p className="mt-2">Most refund decisions are made within 1 to 3 business days after verification.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">How To Request A Refund</h2>
            <p className="mt-2">
              Send your account email, transaction reference, and issue details to support@prosperousdatahub.com.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
