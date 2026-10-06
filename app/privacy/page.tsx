export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-10 text-gray-500">Last updated: October 6, 2026</p>

        <section className="space-y-6 leading-7">
          <div>
            <h2 className="mb-2 text-2xl font-semibold">
              1. Information We Collect
            </h2>
            <p>
              When you use Wr1teHub, we may collect account information such
              as your email address, authentication information, subscription
              information, and usage information.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">
              2. Text You Submit
            </h2>
            <p>
              Text submitted to Wr1teHub may be processed by our service in
              order to provide features such as AI writing assistance,
              rewriting, and AI detection.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">3. Payments</h2>
            <p>
              Payments and subscription billing are processed by Stripe.
              Wr1teHub does not directly store your full payment card
              information.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">
              4. How We Use Information
            </h2>
            <p>
              We use information to provide and maintain Wr1teHub, authenticate
              users, process subscriptions, monitor usage limits, improve
              reliability, and communicate with users when necessary.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">
              5. Service Providers
            </h2>
            <p>
              Wr1teHub may use third-party service providers, including
              Supabase, Stripe, and OpenAI, to provide authentication,
              payments, database services, and AI functionality.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">6. Security</h2>
            <p>
              We take reasonable measures to protect information associated
              with your account. However, no online service can guarantee
              absolute security.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">7. Your Choices</h2>
            <p>
              You may stop using Wr1teHub at any time. You may also contact us
              regarding questions about your account or personal information.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-2xl font-semibold">8. Contact</h2>
            <p>
              For privacy-related questions, please contact Wr1teHub through
              the contact information provided on the website.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}