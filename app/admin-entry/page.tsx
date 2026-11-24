import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminEntryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/access-denied");
  }

  redirect("/admin");
}
