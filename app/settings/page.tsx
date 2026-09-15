import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsClient from "./SettingsClient";
import GoBack from "@/components/GoBack";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* <Header /> */}

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex">
            <GoBack />
            <div className="ml-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your preferences.
              </p>
            </div>
          </div>

          <SettingsClient />
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
