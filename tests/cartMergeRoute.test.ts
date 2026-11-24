import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
// @ts-expect-error Node's TypeScript runner imports source files by extension.
import { createCartMergeHandler } from "../app/api/cart/merge/route.ts";

type Product = { id: number; isActive: boolean; stock: number };
type Receipt = {
  userId: number;
  mergeId: string;
  payloadHash: string;
  result: unknown;
};
type State = {
  receipts: Map<string, Receipt>;
  carts: Map<number, number>;
  items: Map<string, { id: number; cartId: number; productId: number; quantity: number }>;
  products: Map<number, Product>;
};

const originalConsoleError = console.error;
afterEach(() => {
  console.error = originalConsoleError;
});

function receiptKey(userId: number, mergeId: string) {
  return `${userId}:${mergeId}`;
}

function itemKey(cartId: number, productId: number) {
  return `${cartId}:${productId}`;
}

function createHarness(options: {
  barrierInitialLookups?: boolean;
  failProductId?: number;
  failSerialization?: boolean;
} = {}) {
  let state: State = {
    receipts: new Map(),
    carts: new Map(),
    items: new Map(),
    products: new Map([
      [41, { id: 41, isActive: true, stock: 20 }],
      [42, { id: 42, isActive: true, stock: 20 }],
    ]),
  };
  let transactionQueue = Promise.resolve();
  let initialLookups = 0;
  let releaseLookups!: () => void;
  const lookupBarrier = new Promise<void>((resolve) => {
    releaseLookups = resolve;
  });
  let shouldFail = options.failProductId !== undefined;
  let shouldFailSerialization = options.failSerialization === true;

  function createTransactionClient(transactionState: State) {
    const tx = {
      cartMergeReceipt: {
        async create({ data }: { data: Receipt }) {
          const key = receiptKey(data.userId, data.mergeId);
          if (transactionState.receipts.has(key)) {
            throw Object.assign(new Error("unique constraint"), { code: "P2002" });
          }
          transactionState.receipts.set(key, structuredClone(data));
          return data;
        },
        async findUnique({ where }: { where: { userId_mergeId: { userId: number; mergeId: string } } }) {
          const { userId, mergeId } = where.userId_mergeId;
          return transactionState.receipts.get(receiptKey(userId, mergeId)) ?? null;
        },
        async update({ where, data }: { where: { userId_mergeId: { userId: number; mergeId: string } }; data: { result: unknown } }) {
          const { userId, mergeId } = where.userId_mergeId;
          const key = receiptKey(userId, mergeId);
          const receipt = transactionState.receipts.get(key);
          if (!receipt) throw new Error("receipt missing");
          receipt.result = structuredClone(data.result);
          return receipt;
        },
      },
      cart: {
        async findUnique({ where }: { where: { userId: number } }) {
          const id = transactionState.carts.get(where.userId);
          return id === undefined ? null : { id, userId: where.userId };
        },
        async create({ data }: { data: { userId: number } }) {
          transactionState.carts.set(data.userId, data.userId);
          return { id: data.userId, userId: data.userId };
        },
      },
      product: {
        async findUnique({ where }: { where: { id: number } }) {
          return transactionState.products.get(where.id) ?? null;
        },
      },
      cartItem: {
        async findUnique({ where }: { where: { cartId_productId: { cartId: number; productId: number } } }) {
          return transactionState.items.get(itemKey(where.cartId_productId.cartId, where.cartId_productId.productId)) ?? null;
        },
        async upsert({ where, create, update }: {
          where: { cartId_productId: { cartId: number; productId: number } };
          create: { cartId: number; productId: number; quantity: number };
          update: { quantity: number };
        }) {
          const { cartId, productId } = where.cartId_productId;
          if (shouldFail && productId === options.failProductId) {
            shouldFail = false;
            throw new Error("injected failure after earlier item write");
          }
          const key = itemKey(cartId, productId);
          const existing = transactionState.items.get(key);
          const value = existing
            ? { ...existing, quantity: update.quantity }
            : { ...create, id: productId };
          transactionState.items.set(key, value);
          return value;
        },
        async delete({ where }: { where: { id: number } }) {
          for (const [key, item] of transactionState.items) {
            if (item.id === where.id) transactionState.items.delete(key);
          }
        },
      },
      async $queryRaw(_strings: TemplateStringsArray, ...values: number[]) {
        const [userId, mergeId] = values;
        return transactionState.receipts.has(receiptKey(userId, String(mergeId)))
          ? [{ id: String(mergeId) }]
          : [];
      },
    };
    return tx;
  }

  const database = {
    cartMergeReceipt: {
      async findUnique({ where }: { where: { userId_mergeId: { userId: number; mergeId: string } } }) {
        if (options.barrierInitialLookups && initialLookups < 2) {
          initialLookups += 1;
          if (initialLookups === 2) releaseLookups();
          await lookupBarrier;
        }
        const { userId, mergeId } = where.userId_mergeId;
        return state.receipts.get(receiptKey(userId, mergeId)) ?? null;
      },
    },
    async $transaction<T>(callback: (tx: ReturnType<typeof createTransactionClient>) => Promise<T>) {
      const transaction = transactionQueue.then(async () => {
        if (shouldFailSerialization) {
          shouldFailSerialization = false;
          throw Object.assign(new Error("serialization conflict"), { code: "P2034" });
        }
        const workingState = structuredClone(state);
        const result = await callback(createTransactionClient(workingState));
        state = workingState;
        return result;
      });
      transactionQueue = transaction.then(() => undefined, () => undefined);
      return transaction;
    },
  };

  const handler = createCartMergeHandler({
    database: database as never,
    getCurrentUser: async () => ({ id: 7 }) as never,
  });
  return {
    handler,
    state: () => state,
    addProduct(product: Product) {
      state.products.set(product.id, product);
    },
    seedCart(productId: number, quantity: number) {
      state.carts.set(7, 7);
      state.items.set(itemKey(7, productId), { id: productId, cartId: 7, productId, quantity });
    },
  };
}

function request(mergeId: string, items: Array<{ productId: number; quantity: number }>) {
  return new Request("http://localhost/api/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "merge", mergeId, items }),
  });
}

const mergeId = "fa6c260c-4a0a-42de-9a62-683c59c2545b";

test("normal and repeated identical requests apply quantities once", async () => {
  const harness = createHarness();
  const first = await harness.handler(request(mergeId, [{ productId: 41, quantity: 3 }]));
  const replay = await harness.handler(request(mergeId, [{ productId: 41, quantity: 3 }]));

  assert.equal(first.status, 200);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).replayed, true);
  assert.equal(harness.state().items.get("7:41")?.quantity, 3);
  assert.equal(harness.state().receipts.size, 1);
});

test("rejects a changed payload for an existing merge ID without changing cart", async () => {
  const harness = createHarness();
  await harness.handler(request(mergeId, [{ productId: 41, quantity: 2 }]));
  const changed = await harness.handler(request(mergeId, [{ productId: 41, quantity: 5 }]));

  assert.equal(changed.status, 409);
  assert.equal(harness.state().items.get("7:41")?.quantity, 2);
});

test("simultaneous identical requests race on the unique key and only apply once", async () => {
  const harness = createHarness({ barrierInitialLookups: true });
  const responses = await Promise.all([
    harness.handler(request(mergeId, [{ productId: 41, quantity: 4 }])),
    harness.handler(request(mergeId, [{ productId: 41, quantity: 4 }])),
  ]);

  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(harness.state().items.get("7:41")?.quantity, 4);
  assert.equal(harness.state().receipts.size, 1);
});

test("simultaneous changed payloads for one ID commit only one snapshot", async () => {
  const harness = createHarness({ barrierInitialLookups: true });
  const responses = await Promise.all([
    harness.handler(request(mergeId, [{ productId: 41, quantity: 2 }])),
    harness.handler(request(mergeId, [{ productId: 41, quantity: 5 }])),
  ]);

  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.ok([2, 5].includes(harness.state().items.get("7:41")?.quantity ?? 0));
  assert.equal(harness.state().receipts.size, 1);
});

test("a mid-transaction failure rolls back prior item writes and permits same-ID retry", async () => {
  console.error = () => undefined;
  const harness = createHarness({ failProductId: 42 });
  const body = [
    { productId: 41, quantity: 2 },
    { productId: 42, quantity: 3 },
  ];
  const failed = await harness.handler(request(mergeId, body));

  assert.equal(failed.status, 500);
  assert.equal(harness.state().items.size, 0);
  assert.equal(harness.state().receipts.size, 0);

  const retried = await harness.handler(request(mergeId, body));
  assert.equal(retried.status, 200);
  assert.equal(harness.state().items.get("7:41")?.quantity, 2);
  assert.equal(harness.state().items.get("7:42")?.quantity, 3);
  assert.equal(harness.state().receipts.size, 1);
});

test("reports stock adjustment and unavailable products", async () => {
  const harness = createHarness();
  harness.seedCart(41, 1);
  harness.addProduct({ id: 41, isActive: true, stock: 2 });
  harness.addProduct({ id: 42, isActive: false, stock: 10 });

  const response = await harness.handler(request(mergeId, [
    { productId: 41, quantity: 4 },
    { productId: 42, quantity: 1 },
  ]));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    body.result.outcomes.map((outcome: { status: string }) => outcome.status),
    ["stock-adjusted", "unavailable"],
  );
  assert.equal(harness.state().items.get("7:41")?.quantity, 2);
  assert.equal(harness.state().items.has("7:42"), false);
});

test("serialization failure leaves no receipt or cart change", async () => {
  const harness = createHarness({ failSerialization: true });
  const failed = await harness.handler(request(mergeId, [{ productId: 41, quantity: 1 }]));

  assert.equal(failed.status, 409);
  assert.equal(harness.state().receipts.size, 0);
  assert.equal(harness.state().items.size, 0);

  const retry = await harness.handler(request(mergeId, [{ productId: 41, quantity: 1 }]));
  assert.equal(retry.status, 200);
  assert.equal(harness.state().items.get("7:41")?.quantity, 1);
});
