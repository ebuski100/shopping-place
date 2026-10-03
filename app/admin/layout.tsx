import { requireAdminPage } from "@/lib/admin";
import AdminNavigation from "./AdminNavigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminPage();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {" "}
      <AdminNavigation email={user.email}>{children} </AdminNavigation>{" "}
    </div>
  );
}
