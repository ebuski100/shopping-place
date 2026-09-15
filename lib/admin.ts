// import { redirect } from "next/navigation";
// import { getCurrentUser } from "@/lib/auth";

// export async function requireAdmin() {
//   const user = await getCurrentUser();

//   if (!user) {
//     redirect("/login?redirect=/admin");
//   }

//   if (user.role !== "ADMIN") {
//     redirect("/");
//   }

//   return user;
// }

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function requireAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}
