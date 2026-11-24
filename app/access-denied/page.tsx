import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AccessDeniedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
          You are not authorized to access the Admin Dashboard. Your account
          does not have administrator privileges. Please contact the site
          administrator if you believe this is an error.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Return to shopping homepage
        </Link>
      </section>
    </main>
  );
}
