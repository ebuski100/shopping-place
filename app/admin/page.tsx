import { requireAdminPage } from "@/lib/admin";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AdminDashboardPage() {
  await requireAdminPage();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="mx-auto max-w-7xl">
        <AnalyticsDashboard />
      </div>
    </main>
  );
}
