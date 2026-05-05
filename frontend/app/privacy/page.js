export const metadata = {
  title: "Privacy Policy | Prosperous Data Hub"
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6">
      <section className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-black text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">Last updated: May 5, 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 sm:text-base">
          <p>
            Prosperous Data Hub collects only the data needed to provide account, payment, and service fulfillment
            functions.
          </p>

          <div>
            <h2 className="text-base font-bold text-slate-900">Information We Collect</h2>
            <p className="mt-2">
              We collect account profile details, contact information, and transaction records to operate securely and
              comply with applicable regulations.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">How We Use Data</h2>
            <p className="mt-2">
              Data is used for authentication, fraud prevention, payment processing, customer support, and service
              delivery.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Data Sharing</h2>
            <p className="mt-2">
              We share limited data with infrastructure and payment providers only when required to complete a service or
              satisfy legal obligations.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Security And Retention</h2>
            <p className="mt-2">
              We apply access controls, audit logging, and retention limits suitable for platform operations and dispute
              handling.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">Contact</h2>
            <p className="mt-2">For privacy requests, contact support@prosperousdatahub.com.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
