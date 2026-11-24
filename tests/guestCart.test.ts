import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
// @ts-expect-error The Node test runner needs the explicit TypeScript extension.
import * as guestCart from "../lib/guestCart.ts";
import type { CartProduct } from "../types/product";

const {
  addToGuestCart,
  getGuestCart,
  getGuestCartMergeNotice,
  mergeGuestCart,
  removeFromGuestCart,
} = guestCart;

const product: CartProduct = {
  id: 41,
  name: "Test product",
  price: 1200,
  image: "https://cdn.dummyjson.com/products/41/image.jpg",
  stock: 20,
};

let storageValues = new Map<string, string>();
let originalFetch: typeof fetch;

function installStorage(shouldFailWrites = false, supportsLocks = true) {
  const storage = {
    getItem(key: string) {
      return storageValues.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (shouldFailWrites) throw new Error("storage disabled");
      storageValues.set(key, value);
    },
    removeItem(key: string) {
      storageValues.delete(key);
    },
    clear() {
      storageValues.clear();
    },
    key(index: number) {
      return [...storageValues.keys()][index] ?? null;
    },
    get length() {
      return storageValues.size;
    },
  } as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: supportsLocks
      ? {
          locks: {
            request: async (_name: string, callback: (lock: object) => unknown) =>
              callback({}),
          },
        }
      : {},
  });
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  storageValues = new Map();
  originalFetch = globalThis.fetch;
  installStorage();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("preserves existing guest cart data and safely ignores malformed storage", async () => {
  storageValues.set("guest-cart", "not-json");
  assert.deepEqual(getGuestCart(), []);

  await addToGuestCart(product, 2);
  assert.equal(getGuestCart()[0]?.quantity, 2);
});

test("reports unavailable and stock-adjusted reconciliation outcomes", () => {
  const notice = getGuestCartMergeNotice([
    {
      productId: 41,
      requestedQuantity: 3,
      appliedGuestQuantity: 1,
      cartQuantity: 4,
      status: "stock-adjusted",
    },
    {
      productId: 42,
      requestedQuantity: 1,
      appliedGuestQuantity: 0,
      cartQuantity: 0,
      status: "unavailable",
    },
  ]);
  assert.match(notice ?? "", /1 item was unavailable/);
  assert.match(notice ?? "", /1 item was adjusted for stock/);
});

test("does not send a merge until its immutable pending snapshot is persisted", async () => {
  installStorage(true);
  await assert.rejects(addToGuestCart(product, 1), /could not be saved/);
  assert.equal(getGuestCart().length, 0);
});

test("does not merge across tabs when Web Locks are unavailable", async () => {
  await addToGuestCart(product, 1);
  installStorage(false, false);
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return jsonResponse({});
  };

  await assert.rejects(mergeGuestCart(), /Cross-tab cart reconciliation is unavailable/);
  assert.equal(requests, 0);
  assert.equal(storageValues.has("guest-cart-pending-merge"), false);
  assert.equal(getGuestCart()[0]?.quantity, 1);
});

test("retries an ambiguous committed merge with the same id and payload", async () => {
  await addToGuestCart(product, 2);

  let serverQuantity = 0;
  let calls = 0;
  let firstRequest: { mergeId: string; body: string } | null = null;
  const receipts = new Map<string, unknown>();

  globalThis.fetch = async (_input, init) => {
    calls += 1;
    const body = String(init?.body);
    const request = JSON.parse(body) as {
      mergeId: string;
      items: Array<{ productId: number; quantity: number }>;
    };
    const pending = JSON.parse(storageValues.get("guest-cart-pending-merge") || "null");
    assert.equal(pending.payload.mergeId, request.mergeId);

    if (receipts.has(request.mergeId)) {
      assert.equal(firstRequest?.body, body);
      return jsonResponse({ result: receipts.get(request.mergeId), replayed: true });
    }

    const item = request.items[0];
    serverQuantity += item.quantity;
    const result = {
      rootMergeId: request.mergeId,
      baselineQuantities: { [item.productId]: 0 },
      appliedQuantities: { [item.productId]: serverQuantity },
      outcomes: [{
        productId: item.productId,
        requestedQuantity: item.quantity,
        appliedGuestQuantity: item.quantity,
        cartQuantity: serverQuantity,
        status: "merged",
      }],
    };
    receipts.set(request.mergeId, result);
    firstRequest = { mergeId: request.mergeId, body };
    throw new TypeError("response lost after commit");
  };

  await mergeGuestCart();

  assert.equal(calls, 2);
  assert.equal(serverQuantity, 2);
  assert.equal(getGuestCart().length, 0);
  assert.equal(storageValues.has("guest-cart-pending-merge"), false);
});

test("retains the same snapshot when a successful HTTP response is malformed", async () => {
  await addToGuestCart(product, 1);

  let calls = 0;
  const bodies: string[] = [];
  globalThis.fetch = async (_input, init) => {
    calls += 1;
    bodies.push(String(init?.body));
    return jsonResponse({ message: "ok" });
  };

  await assert.rejects(mergeGuestCart(), /could not be confirmed/);
  assert.equal(calls, 2);
  assert.equal(bodies[0], bodies[1]);
  const pendingAfterFailure = JSON.parse(
    storageValues.get("guest-cart-pending-merge") || "null",
  );
  assert.equal(pendingAfterFailure.payload.mergeId, JSON.parse(bodies[0]).mergeId);
  assert.equal(getGuestCart()[0]?.quantity, 1);
});

test("reconciles cart edits made while the original merge is pending", async () => {
  await addToGuestCart(product, 2);

  let serverQuantity = 5;
  let initialStarted!: () => void;
  let releaseInitial!: () => void;
  const started = new Promise<void>((resolve) => {
    initialStarted = resolve;
  });
  const release = new Promise<void>((resolve) => {
    releaseInitial = resolve;
  });
  const receipts = new Map<string, { hashBody: string; result: unknown }>();
  let rootMergeId = "";

  globalThis.fetch = async (_input, init) => {
    const body = String(init?.body);
    const request = JSON.parse(body) as {
      mode: "merge" | "reconcile";
      mergeId: string;
      rootMergeId?: string;
      parentMergeId?: string;
      affectedProductIds?: number[];
      items: Array<{ productId: number; quantity: number }>;
    };

    const prior = receipts.get(request.mergeId);
    if (prior) {
      assert.equal(prior.hashBody, body);
      return jsonResponse({ result: prior.result, replayed: true });
    }

    const item = request.items[0];
    let result;
    if (request.mode === "merge") {
      rootMergeId = request.mergeId;
      const baseline = serverQuantity;
      serverQuantity += item.quantity;
      result = {
        rootMergeId,
        baselineQuantities: { [item.productId]: baseline },
        appliedQuantities: { [item.productId]: serverQuantity },
        outcomes: [{ productId: item.productId, requestedQuantity: item.quantity, appliedGuestQuantity: item.quantity, cartQuantity: serverQuantity, status: "merged" }],
      };
      receipts.set(request.mergeId, { hashBody: body, result });
      initialStarted();
      await release;
    } else {
      assert.equal(request.rootMergeId, rootMergeId);
      const root = receipts.get(rootMergeId)?.result as {
        baselineQuantities: Record<string, number>;
      };
      serverQuantity = root.baselineQuantities[String(item.productId)] + item.quantity;
      result = {
        rootMergeId,
        baselineQuantities: root.baselineQuantities,
        appliedQuantities: { [item.productId]: serverQuantity },
        outcomes: [{ productId: item.productId, requestedQuantity: item.quantity, appliedGuestQuantity: item.quantity, cartQuantity: serverQuantity, status: "merged" }],
      };
      receipts.set(request.mergeId, { hashBody: body, result });
    }

    return jsonResponse({ result, replayed: false });
  };

  const merging = mergeGuestCart();
  await started;
  await addToGuestCart(product, 1);
  releaseInitial();
  await merging;

  assert.equal(serverQuantity, 8);
  assert.equal(getGuestCart().length, 0);
  assert.equal(receipts.size, 2);
});

test("removal during a pending merge restores the pre-merge cart quantity", async () => {
  await addToGuestCart(product, 2);

  let serverQuantity = 5;
  let initialStarted!: () => void;
  let releaseInitial!: () => void;
  const started = new Promise<void>((resolve) => {
    initialStarted = resolve;
  });
  const release = new Promise<void>((resolve) => {
    releaseInitial = resolve;
  });
  const receipts = new Map<string, { body: string; result: unknown }>();
  let rootMergeId = "";

  globalThis.fetch = async (_input, init) => {
    const body = String(init?.body);
    const request = JSON.parse(body) as {
      mode: "merge" | "reconcile";
      mergeId: string;
      rootMergeId?: string;
      items: Array<{ productId: number; quantity: number }>;
      affectedProductIds?: number[];
    };
    const prior = receipts.get(request.mergeId);
    if (prior) {
      assert.equal(prior.body, body);
      return jsonResponse({ result: prior.result });
    }

    let outcomes;
    let baseline: number;
    if (request.mode === "merge") {
      rootMergeId = request.mergeId;
      baseline = serverQuantity;
      serverQuantity += request.items[0].quantity;
      outcomes = [{
        productId: product.id,
        requestedQuantity: request.items[0].quantity,
        appliedGuestQuantity: request.items[0].quantity,
        cartQuantity: serverQuantity,
        status: "merged",
      }];
      initialStarted();
      await release;
    } else {
      assert.equal(request.rootMergeId, rootMergeId);
      baseline = 5;
      serverQuantity = baseline;
      outcomes = [{
        productId: product.id,
        requestedQuantity: 0,
        appliedGuestQuantity: 0,
        cartQuantity: serverQuantity,
        status: "removed",
      }];
    }

    const result = {
      rootMergeId,
      baselineQuantities: { [product.id]: baseline },
      appliedQuantities: { [product.id]: serverQuantity },
      outcomes,
    };
    receipts.set(request.mergeId, { body, result });
    return jsonResponse({ result });
  };

  const merging = mergeGuestCart();
  await started;
  await removeFromGuestCart(product.id);
  releaseInitial();
  await merging;

  assert.equal(serverQuantity, 5);
  assert.equal(getGuestCart().length, 0);
  assert.equal(receipts.size, 2);
});
