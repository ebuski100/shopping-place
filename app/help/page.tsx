import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const faqs = [
  {
    question: "How do I place an order?",
    answer:
      "Browse our products, select the item you want, add it to your cart, and proceed to checkout. Review your delivery and payment information before confirming your order.",
  },
  {
    question: "How can I check my order?",
    answer:
      "Sign in to your account and open the Orders section. You can view your orders and their current status there.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Orders may be cancelled when they have not yet reached a stage where fulfilment or delivery prevents cancellation. Contact support as soon as possible if you need to cancel an order.",
  },
  {
    question: "My order hasn't arrived. What should I do?",
    answer:
      "Check your order status first. If the expected delivery period has passed, contact support with your order number so we can investigate.",
  },
  {
    question: "My payment was successful but my order isn't showing as paid.",
    answer:
      "Please don't make another payment immediately. Check your order after a few minutes. If the payment status still hasn't updated, contact support with your order number and payment reference.",
  },
  {
    question: "What if I received the wrong or damaged item?",
    answer:
      "Contact us as soon as possible and provide your order number and clear photos of the item and packaging where applicable.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Help Center
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
              Find answers to common questions about orders, payments, delivery,
              returns, and your account.
            </p>
          </div>

          {/* Quick links */}
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            <Link
              href="/returns-refunds"
              className="rounded-xl border bg-white p-6 transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-semibold">Returns & Refunds</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Learn about eligible returns and refunds.
              </p>
            </Link>

            <Link
              href="/disputes"
              className="rounded-xl border bg-white p-6 transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-semibold">Disputes & Reports</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Report order, product, or payment problems.
              </p>
            </Link>

            <Link
              href="/orders"
              className="rounded-xl border bg-white p-6 transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-semibold">My Orders</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                View your orders and their current status.
              </p>
            </Link>
          </div>

          {/* FAQs */}
          <section>
            <h2 className="mb-6 text-2xl font-semibold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                >
                  <summary className="cursor-pointer list-none font-medium">
                    <div className="flex items-center justify-between gap-4">
                      <span>{faq.question}</span>

                      <span className="text-xl text-gray-400 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </div>
                  </summary>

                  <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="mt-12 rounded-xl border bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold">Still need help?</h2>

            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
              If you couldn't find an answer here, contact our support team with
              your order number and a description of the issue.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/returns-refunds"
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-white dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Returns & Refunds
              </Link>

              <Link
                href="/disputes"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Report a Problem
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
