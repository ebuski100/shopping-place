import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ReturnsRefundsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Customer Support
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Returns & Refunds
            </h1>

            <p className="mt-3 text-gray-500 dark:text-gray-400">
              Information about eligible returns, damaged items, and refunds.
            </p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold">1. Eligible Returns</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                A return may be accepted when you received the wrong product,
                the product arrived damaged or defective, the product materially
                differs from its description, or the item is otherwise eligible
                for return under the applicable product or seller terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">2. Return Timeframe</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Please contact us as soon as possible after receiving your order
                if you believe an item is eligible for return. Where a specific
                return period applies to a product, seller, or order, that
                period will take precedence.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                3. Condition of Returned Items
              </h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Unless an item is defective, damaged, incorrect, or otherwise
                covered by an exception, returned products should generally be
                unused, in their original condition, and returned with their
                original packaging where reasonably possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                4. How to Request a Return
              </h2>

              <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7 text-gray-600 dark:text-gray-400">
                <li>Open your Orders page.</li>
                <li>Identify the affected order.</li>
                <li>Contact support or submit a dispute.</li>
                <li>Explain the problem clearly.</li>
                <li>Provide photographs or other evidence when requested.</li>
                <li>Follow the return instructions provided by support.</li>
              </ol>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Do not send an item to an address unless you have received
                return instructions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                5. Damaged or Incorrect Items
              </h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                If your item arrives damaged, defective, or different from what
                you ordered, contact us promptly. Please provide your order
                number, a description of the problem, and photographs of the
                item and packaging where relevant.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">6. Refunds</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                When a refund is approved, it will generally be sent through the
                original payment method where possible. The time required for
                the refund to appear in your account may depend on the payment
                provider and your bank or financial institution.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">7. Partial Refunds</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Depending on the circumstances, we may approve a partial refund
                rather than a full refund. This may apply when only part of an
                order is affected or when the applicable return terms provide
                for a partial refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">8. Non-Returnable Items</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Certain products may not be eligible for return, including
                personalized products, products that cannot reasonably be resold
                for health or hygiene reasons, consumed products, or products
                identified as non-returnable at the time of purchase.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                9. Fraudulent or Abusive Returns
              </h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                We reserve the right to investigate suspicious, fraudulent, or
                abusive return activity, including repeated false claims,
                fabricated evidence, or attempts to obtain an improper refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                10. Disagreements About a Refund
              </h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                If you disagree with a return or refund decision, you may submit
                a dispute for review.
              </p>

              <Link
                href="/disputes"
                className="mt-4 inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Submit a Dispute
              </Link>
            </section>

            <section className="border-t pt-8 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-300">
                  Last updated:
                </strong>{" "}
                September 2026
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Nothing in this policy is intended to remove or restrict
                consumer rights that cannot legally be excluded under applicable
                law.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
