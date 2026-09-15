import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type PaymentCallbackPageProps = {
  searchParams: Promise<{
    reference?: string;
  }>;
};

export default async function PaymentCallbackPage({
  searchParams,
}: PaymentCallbackPageProps) {
  const params = await searchParams;

  const reference = params.reference;

  if (!reference) {
    redirect("/orders");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const order = await prisma.order.findFirst({
    where: {
      payStackReference: reference,
      userId: user.id,
    },
  });

  if (!order) {
    redirect("/orders");
  }

  redirect(`/orders/${order.id}`);
}
