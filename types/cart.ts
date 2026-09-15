import type { Prisma } from "@/lib/generated/prisma/client";

export type Cart = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

export type CartItem = Cart["items"][number];
