export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-4xl font-bold">
          Refund & Cancellation Policy
        </h1>

        <p className="mb-10 text-gray-500">
          Last updated: October 6, 2026
        </p>

        <section className="space-y-6 leading-7">
          <div>
            <h2 className="mb-2 text-2xl font-semibold">1. Subscription</h2>
            <p>
              Wr1teHub Pro is a monthly subscription that costs $9.99 USD per
              month and automatically renews until cancelled.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">2. Cancellation</h2>
            <p>
              You may cancel your subscription at any time. Cancellation
              prevents future subscription renewals and future charges.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">3. Refunds</h2>
            <p>
              Subscription payments are generally non-refundable. If you
              believe you were charged in error or have another billing issue,
              please contact Wr1teHub so we can review the situation.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">4. Billing Issues</h2>
            <p>
              If you notice an unauthorized or incorrect charge, please contact
              Wr1teHub as soon as possible so the issue can be investigated.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">5. Contact</h2>
            <p>
              For billing, cancellation, or refund questions, please contact
              Wr1teHub through the contact information provided on the website.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}