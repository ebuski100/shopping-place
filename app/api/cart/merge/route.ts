import { createHash } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_QUANTITY = 2_147_483_647;
const cartItemInput = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(MAX_QUANTITY),
});

const mergeRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("merge"),
    mergeId: z.string().uuid(),
    items: z.array(cartItemInput),
  }),
  z.object({
    mode: z.literal("reconcile"),
    mergeId: z.string().uuid(),
    rootMergeId: z.string().uuid(),
    parentMergeId: z.string().uuid(),
    affectedProductIds: z.array(z.number().int().positive()),
    items: z.array(cartItemInput),
  }),
]);

type MergeOutcome = {
  productId: number;
  requestedQuantity: number;
  appliedGuestQuantity: number;
  cartQuantity: number;
  status: "merged" | "stock-adjusted" | "unavailable" | "removed";
};

type MergeReceiptResult = {
  rootMergeId: string;
  baselineQuantities: Record<string, number>;
  appliedQuantities: Record<string, number>;
  outcomes: MergeOutcome[];
};

class MergeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MergeConflictError";
  }
}

function normalizeItems(items: Array<{ productId: number; quantity: number }>) {
  const quantities = new Map<number, number>();

  for (const item of items) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity) || quantity > MAX_QUANTITY) {
      throw new Error("Cart quantity is too large");
    }
    quantities.set(item.productId, quantity);
  }

  return [...quantities]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId - b.productId);
}

function hashPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function isPrismaCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function readReceiptResult(value: Prisma.JsonValue): MergeReceiptResult {
  return value as unknown as MergeReceiptResult;
}

async function existingReceiptResponse(
  database: typeof prisma,
  userId: number,
  mergeId: string,
  payloadHash: string,
) {
  const receipt = await database.cartMergeReceipt.findUnique({
    where: { userId_mergeId: { userId, mergeId } },
  });

  if (!receipt) return null;
  if (receipt.payloadHash !== payloadHash) {
    return Response.json(
      { error: "Merge ID was already used with a different cart snapshot" },
      { status: 409 },
    );
  }

  return Response.json({
    message: "Cart reconciliation confirmed",
    result: readReceiptResult(receipt.result),
    replayed: true,
  });
}

async function mergeSnapshot(
  database: typeof prisma,
  userId: number,
  mergeId: string,
  payloadHash: string,
  items: Array<{ productId: number; quantity: number }>,
) {
  return database.$transaction(
    async (tx) => {
      await tx.cartMergeReceipt.create({
        data: { userId, mergeId, payloadHash, result: {} },
      });

      let cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) cart = await tx.cart.create({ data: { userId } });

      const baselineQuantities: Record<string, number> = {};
      const appliedQuantities: Record<string, number> = {};
      const outcomes: MergeOutcome[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: { cartId: cart.id, productId: item.productId },
          },
        });
        const baseline = existingItem?.quantity ?? 0;
        const key = String(item.productId);
        baselineQuantities[key] = baseline;

        if (!product || !product.isActive || product.stock <= 0) {
          appliedQuantities[key] = baseline;
          outcomes.push({
            productId: item.productId,
            requestedQuantity: item.quantity,
            appliedGuestQuantity: 0,
            cartQuantity: baseline,
            status: "unavailable",
          });
          continue;
        }

        const desired = baseline + item.quantity;
        const nextQuantity = Math.min(desired, product.stock);
        if (nextQuantity > 0) {
          await tx.cartItem.upsert({
            where: {
              cartId_productId: {
                cartId: cart.id,
                productId: item.productId,
              },
            },
            create: {
              cartId: cart.id,
              productId: item.productId,
              quantity: nextQuantity,
            },
            update: { quantity: nextQuantity },
          });
        } else if (existingItem) {
          await tx.cartItem.delete({ where: { id: existingItem.id } });
        }

        appliedQuantities[key] = nextQuantity;
        outcomes.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          appliedGuestQuantity: Math.max(0, nextQuantity - baseline),
          cartQuantity: nextQuantity,
          status:
            nextQuantity < desired
              ? "stock-adjusted"
              : "merged",
        });
      }

      const result: MergeReceiptResult = {
        rootMergeId: mergeId,
        baselineQuantities,
        appliedQuantities,
        outcomes,
      };

      await tx.cartMergeReceipt.update({
        where: { userId_mergeId: { userId, mergeId } },
        data: { result: result as Prisma.InputJsonValue },
      });

      return result;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function reconcileSnapshot(
  database: typeof prisma,
  userId: number,
  request: Extract<z.infer<typeof mergeRequestSchema>, { mode: "reconcile" }>,
  payloadHash: string,
  items: Array<{ productId: number; quantity: number }>,
) {
  const affectedProductIds = [
    ...new Set([
      ...request.affectedProductIds,
      ...items.map(({ productId }) => productId),
    ]),
  ].sort((a, b) => a - b);

  return database.$transaction(
    async (tx) => {
      // Serialize reconciliation branches for this root merge. The receipt
      // row lock also makes concurrent tabs observe the latest applied state.
      const lockedRoot = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "CartMergeReceipt"
        WHERE "userId" = ${userId} AND "mergeId" = ${request.rootMergeId}
        FOR UPDATE
      `;
      if (lockedRoot.length === 0) {
        throw new MergeConflictError("Original cart merge was not found");
      }

      await tx.cartMergeReceipt.create({
        data: { userId, mergeId: request.mergeId, payloadHash, result: {} },
      });

      const root = await tx.cartMergeReceipt.findUnique({
        where: {
          userId_mergeId: { userId, mergeId: request.rootMergeId },
        },
      });
      const parent = await tx.cartMergeReceipt.findUnique({
        where: {
          userId_mergeId: { userId, mergeId: request.parentMergeId },
        },
      });
      if (!root || !parent) {
        throw new MergeConflictError("Cart reconciliation receipt was not found");
      }

      const rootResult = readReceiptResult(root.result);
      const parentResult = readReceiptResult(parent.result);
      if (
        parentResult.rootMergeId !== request.rootMergeId ||
        rootResult.rootMergeId !== request.rootMergeId
      ) {
        throw new MergeConflictError("Cart reconciliation chain is invalid");
      }

      let cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) cart = await tx.cart.create({ data: { userId } });

      const guestQuantities = new Map(
        items.map(({ productId, quantity }) => [productId, quantity]),
      );
      const baselineQuantities = { ...parentResult.baselineQuantities };
      const appliedQuantities: Record<string, number> = {};
      const outcomes: MergeOutcome[] = [];

      for (const productId of affectedProductIds) {
        const key = String(productId);
        const currentItem = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId } },
        });
        const currentQuantity = currentItem?.quantity ?? 0;
        const expectedQuantity = parentResult.appliedQuantities[key];
        const baseline =
          baselineQuantities[key] === undefined
            ? currentQuantity
            : baselineQuantities[key] +
              (expectedQuantity === undefined
                ? 0
                : currentQuantity - expectedQuantity);
        baselineQuantities[key] = Math.max(0, baseline);
        const requestedGuestQuantity = guestQuantities.get(productId) ?? 0;
        const product = await tx.product.findUnique({ where: { id: productId } });

        if (!product) {
          appliedQuantities[key] = 0;
          outcomes.push({
            productId,
            requestedQuantity: requestedGuestQuantity,
            appliedGuestQuantity: 0,
            cartQuantity: 0,
            status: "unavailable",
          });
          continue;
        }

        const unavailable =
          requestedGuestQuantity > 0 &&
          (!product.isActive || product.stock <= 0);
        const desired = unavailable
          ? baselineQuantities[key]
          : baselineQuantities[key] + requestedGuestQuantity;
        const nextQuantity =
          product.stock > 0 ? Math.min(desired, product.stock) : baseline;

        if (nextQuantity > 0) {
          await tx.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId } },
            create: { cartId: cart.id, productId, quantity: nextQuantity },
            update: { quantity: nextQuantity },
          });
        } else if (currentItem) {
          await tx.cartItem.delete({ where: { id: currentItem.id } });
        }

        appliedQuantities[key] = nextQuantity;
        outcomes.push({
          productId,
          requestedQuantity: requestedGuestQuantity,
          appliedGuestQuantity: unavailable
            ? 0
          : Math.max(0, nextQuantity - baselineQuantities[key]),
          cartQuantity: nextQuantity,
          status: unavailable
            ? "unavailable"
            : requestedGuestQuantity === 0
              ? "removed"
              : nextQuantity < desired
                ? "stock-adjusted"
                : "merged",
        });
      }

      const result: MergeReceiptResult = {
        rootMergeId: request.rootMergeId,
        baselineQuantities,
        appliedQuantities,
        outcomes,
      };

      await tx.cartMergeReceipt.update({
        where: { userId_mergeId: { userId, mergeId: request.mergeId } },
        data: { result: result as Prisma.InputJsonValue },
      });

      return result;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

type MergeHandlerDependencies = {
  database: typeof prisma;
  getCurrentUser: typeof getCurrentUser;
};

export function createCartMergeHandler({
  database,
  getCurrentUser,
}: MergeHandlerDependencies) {
  return async function POST(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const parsed = mergeRequestSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Invalid cart reconciliation data" }, { status: 400 });
      }

      const requestData = parsed.data;
      const items = normalizeItems(requestData.items);
      const payload =
        requestData.mode === "merge"
          ? { version: 1, mode: "merge", items }
          : {
              version: 1,
              mode: "reconcile",
              rootMergeId: requestData.rootMergeId,
              parentMergeId: requestData.parentMergeId,
              affectedProductIds: [...new Set(requestData.affectedProductIds)].sort(
                (a, b) => a - b,
              ),
              items,
            };
      const payloadHash = hashPayload(payload);

      const priorResponse = await existingReceiptResponse(
        database,
        user.id,
        requestData.mergeId,
        payloadHash,
      );
      if (priorResponse) return priorResponse;

      try {
        const result =
          requestData.mode === "merge"
            ? await mergeSnapshot(database, user.id, requestData.mergeId, payloadHash, items)
            : await reconcileSnapshot(
                database,
                user.id,
                requestData,
                payloadHash,
                items,
              );

        return Response.json({
          message: "Cart reconciliation confirmed",
          result,
          replayed: false,
        });
      } catch (error) {
        // A concurrent identical request may have won the unique-key race.
        const replay = await existingReceiptResponse(
          database,
          user.id,
          requestData.mergeId,
          payloadHash,
        );
        if (replay) return replay;
        if (error instanceof MergeConflictError) {
          return Response.json({ error: error.message }, { status: 409 });
        }
        if (isPrismaCode(error, "P2034")) {
          return Response.json(
            { error: "Cart changed concurrently; retry this same merge" },
            { status: 409 },
          );
        }
        throw error;
      }
    } catch (error) {
      console.error("Merge cart error:", error);
      return Response.json({ error: "Failed to reconcile guest cart" }, { status: 500 });
    }
  };
}

export const POST = createCartMergeHandler({ database: prisma, getCurrentUser });
