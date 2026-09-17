import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function DisputesPage() {
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
              Disputes & Reports
            </h1>

            <p className="mt-3 text-gray-500 dark:text-gray-400">
              Report problems with orders, products, payments, or other
              marketplace activity.
            </p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold">What Can I Report?</h2>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Wrong item received",
                  "Damaged or defective item",
                  "Product significantly different from its description",
                  "Missing item from an order",
                  "Delivery problems",
                  "Payment problems",
                  "Suspected fraudulent activity",
                  "Misleading product information",
                  "Suspicious seller or customer activity",
                  "Other shopping-related problems",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Order Disputes</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                If your dispute relates to a specific order, include your order
                number. Explain what happened, when the problem occurred, what
                you expected to receive, what you actually received, and what
                resolution you are requesting.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Reporting a Product</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                If you believe a product listing contains inaccurate,
                misleading, prohibited, or inappropriate information, report the
                listing so it can be reviewed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Payment Disputes</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                If you believe you were charged incorrectly or a payment was not
                properly reflected on your order, contact support before making
                another payment.
              </p>

              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-900/50 dark:bg-yellow-950/30">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Never send your card PIN, OTP, password, or authentication
                  codes to support.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Evidence</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Providing accurate evidence helps us investigate disputes.
                Depending on the issue, useful evidence may include photos,
                videos, screenshots, payment confirmations, order information,
                delivery information, and relevant communications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Investigation</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                We may review information relevant to the transaction, including
                order records, payment information, delivery information,
                product information, and communications related to the dispute.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Possible Resolutions</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Depending on the circumstances, a dispute may result in
                additional investigation, correction of an order issue,
                replacement of an eligible item, return authorization, partial
                or full refund, cancellation of an affected order, or action
                relating to a product listing or account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Escalating a Dispute</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                If you disagree with the outcome of an investigation, you may
                request a review by contacting support and explaining why you
                believe the decision should be reconsidered.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                False or Abusive Reports
              </h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Reports should be submitted honestly and in good faith.
                Fabricated evidence, fraudulent claims, harassment, or
                deliberate misuse of the reporting system may result in account
                restrictions or other appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">
                Submit an Order-Related Issue
              </h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                For an issue involving one of your orders, start from your
                Orders page so the relevant order information is available.
              </p>

              <Link
                href="/orders"
                className="mt-4 inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                View My Orders
              </Link>
            </section>

            <section className="border-t pt-8 dark:border-gray-800">
              <h2 className="text-xl font-semibold">Privacy & Security</h2>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
                Only provide information necessary to investigate your report.
                Never send passwords, card PINs, OTPs, banking passwords,
                authentication codes, or other sensitive security credentials.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
