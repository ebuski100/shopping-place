import type { CartProduct } from "@/types/product";

export type GuestCartItem = {
  product: CartProduct;
  quantity: number;
};

export type GuestCartMergeOutcome = {
  productId: number;
  requestedQuantity: number;
  appliedGuestQuantity: number;
  cartQuantity: number;
  status: "merged" | "stock-adjusted" | "unavailable" | "removed";
};

export function getGuestCartMergeNotice(outcomes: GuestCartMergeOutcome[]) {
  const latestByProduct = new Map<number, GuestCartMergeOutcome>();
  for (const outcome of outcomes) latestByProduct.set(outcome.productId, outcome);
  const latest = [...latestByProduct.values()];
  const unavailable = latest.filter((item) => item.status === "unavailable").length;
  const adjusted = latest.filter((item) => item.status === "stock-adjusted").length;
  if (unavailable === 0 && adjusted === 0) return null;

  const parts = [];
  if (unavailable) {
    parts.push(`${unavailable} ${unavailable === 1 ? "item was" : "items were"} unavailable`);
  }
  if (adjusted) {
    parts.push(`${adjusted} ${adjusted === 1 ? "item was" : "items were"} adjusted for stock`);
  }
  return `${parts.join("; ")}. Review your cart for current availability and quantities.`;
}

type MergePayload =
  | {
      mode: "merge";
      mergeId: string;
      items: Array<{ productId: number; quantity: number }>;
    }
  | {
      mode: "reconcile";
      mergeId: string;
      rootMergeId: string;
      parentMergeId: string;
      affectedProductIds: number[];
      items: Array<{ productId: number; quantity: number }>;
    };

type PendingMerge = {
  phase: "pending" | "complete";
  rootMergeId: string;
  snapshot: GuestCartItem[];
  affectedProductIds: number[];
  payload: MergePayload;
};

type MergeResponse = {
  result: {
    outcomes: GuestCartMergeOutcome[];
  };
};

function isMergeResponse(value: unknown, payload: MergePayload): value is MergeResponse {
  if (typeof value !== "object" || value === null || !("result" in value)) {
    return false;
  }

  const result = value.result;
  if (
    typeof result !== "object" ||
    result === null ||
    !("rootMergeId" in result) ||
    !("outcomes" in result) ||
    !Array.isArray(result.outcomes)
  ) {
    return false;
  }

  const rootMergeId = payload.mode === "merge" ? payload.mergeId : payload.rootMergeId;
  if (result.rootMergeId !== rootMergeId) return false;

  const expectedIds = new Set(
    payload.mode === "merge"
      ? payload.items.map((item) => item.productId)
      : [...payload.affectedProductIds, ...payload.items.map((item) => item.productId)],
  );
  const outcomeIds = new Set<number>();

  for (const outcome of result.outcomes) {
    if (
      typeof outcome !== "object" ||
      outcome === null ||
      !Number.isInteger(outcome.productId) ||
      !Number.isInteger(outcome.requestedQuantity) ||
      !Number.isInteger(outcome.appliedGuestQuantity) ||
      !Number.isInteger(outcome.cartQuantity) ||
      !["merged", "stock-adjusted", "unavailable", "removed"].includes(
        String(outcome.status),
      ) ||
      outcomeIds.has(outcome.productId)
    ) {
      return false;
    }
    outcomeIds.add(outcome.productId);
  }

  return (
    outcomeIds.size === expectedIds.size &&
    [...expectedIds].every((productId) => outcomeIds.has(productId))
  );
}

const GUEST_CART_KEY = "guest-cart";
const PENDING_MERGE_KEY = "guest-cart-pending-merge";
const LOCK_NAME = "shopping-place-guest-cart";
const MAX_CART_QUANTITY = 2_147_483_647;
let fallbackLock: Promise<unknown> = Promise.resolve();
let mergePromise: Promise<GuestCartMergeOutcome[]> | null = null;

function withGuestCartLock<T>(callback: () => Promise<T> | T): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks
      .request<Promise<T>>(LOCK_NAME, async () => await callback())
      .then((result) => result);
  }

  const operation = fallbackLock.then(
    async () => await callback(),
    async () => await callback(),
  );
  fallbackLock = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

function isGuestCartItem(value: unknown): value is GuestCartItem {
  if (typeof value !== "object" || value === null || !("product" in value)) {
    return false;
  }

  const candidate = value as Partial<GuestCartItem>;
  const product = candidate.product;
  return (
    Number.isInteger(candidate.quantity) &&
    (candidate.quantity ?? 0) > 0 &&
    (candidate.quantity ?? 0) <= MAX_CART_QUANTITY &&
    typeof product === "object" &&
    product !== null &&
    Number.isInteger(product.id) &&
    (product.id ?? 0) > 0 &&
    typeof product.name === "string" &&
    Number.isInteger(product.price) &&
    (product.price ?? -1) >= 0 &&
    typeof product.image === "string" &&
    Number.isInteger(product.stock) &&
    (product.stock ?? -1) >= 0
  );
}

function readGuestCartUnsafe(): GuestCartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const storedCart = localStorage.getItem(GUEST_CART_KEY);
    if (!storedCart) return [];

    const parsed: unknown = JSON.parse(storedCart);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isGuestCartItem);
  } catch {
    return [];
  }
}

export function getGuestCart(): GuestCartItem[] {
  return readGuestCartUnsafe();
}

function writeGuestCart(items: GuestCartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    throw new Error("The guest cart could not be saved on this device.");
  }
}

export function saveGuestCart(items: GuestCartItem[]) {
  writeGuestCart(items);
}

function newMergeId() {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure cart reconciliation is unavailable in this browser.");
  }

  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function readPendingMerge(): PendingMerge | null {
  try {
    const value = localStorage.getItem(PENDING_MERGE_KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("payload" in parsed) ||
      !("snapshot" in parsed) ||
      !("rootMergeId" in parsed) ||
      !Array.isArray(parsed.snapshot)
    ) {
      throw new Error("Saved cart reconciliation data is invalid and was retained.");
    }
    return parsed as PendingMerge;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Saved cart reconciliation data is unreadable and was retained.");
    }
    throw error;
  }
}

function writePendingMerge(pending: PendingMerge) {
  try {
    localStorage.setItem(PENDING_MERGE_KEY, JSON.stringify(pending));
  } catch {
    throw new Error("Cart reconciliation could not be saved safely; no request was sent.");
  }
}

function clearPendingMerge() {
  try {
    localStorage.removeItem(PENDING_MERGE_KEY);
  } catch {
    throw new Error("Cart reconciliation is confirmed but its local marker could not be cleared.");
  }
}

function cartPayload(items: GuestCartItem[]) {
  return items.map(({ product, quantity }) => ({
    productId: product.id,
    quantity,
  }));
}

function sameCartQuantities(a: GuestCartItem[], b: GuestCartItem[]) {
  const normalize = (items: GuestCartItem[]) =>
    items
      .map(({ product, quantity }) => [product.id, quantity] as const)
      .sort(([firstId], [secondId]) => firstId - secondId);
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function makeInitialPending(items: GuestCartItem[]): PendingMerge {
  const mergeId = newMergeId();
  return {
    phase: "pending",
    rootMergeId: mergeId,
    snapshot: items,
    affectedProductIds: items.map(({ product }) => product.id),
    payload: { mode: "merge", mergeId, items: cartPayload(items) },
  };
}

function makeReconciliationPending(
  currentItems: GuestCartItem[],
  rootMergeId: string,
  parentMergeId: string,
  affectedProductIds: number[],
): PendingMerge {
  const mergeId = newMergeId();
  const allAffected = [
    ...new Set([
      ...affectedProductIds,
      ...currentItems.map(({ product }) => product.id),
    ]),
  ].sort((a, b) => a - b);

  return {
    phase: "pending",
    rootMergeId,
    snapshot: currentItems,
    affectedProductIds: allAffected,
    payload: {
      mode: "reconcile",
      mergeId,
      rootMergeId,
      parentMergeId,
      affectedProductIds: allAffected,
      items: cartPayload(currentItems),
    },
  };
}

async function sendPendingMerge(payload: MergePayload): Promise<MergeResponse> {
  const body = JSON.stringify(payload);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/cart/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (response.ok) {
        const result: unknown = await response.json();
        if (!isMergeResponse(result, payload)) {
          throw new TypeError("Cart reconciliation response could not be confirmed");
        }
        return result;
      }
      const details = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (response.status >= 500 && attempt === 0) continue;
      throw new Error(details?.error || "Failed to reconcile guest cart");
    } catch (error) {
      if (attempt === 0 && (error instanceof TypeError || error instanceof SyntaxError)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Cart reconciliation could not be confirmed. Your cart is still saved.");
}

async function runMergeGuestCart(): Promise<GuestCartMergeOutcome[]> {
  if (typeof navigator !== "undefined" && !navigator.locks) {
    throw new Error(
      "Cross-tab cart reconciliation is unavailable in this browser. Your guest cart remains saved on this device.",
    );
  }

  let pending = await withGuestCartLock(() => {
    const existing = readPendingMerge();
    if (existing?.phase === "complete") {
      finalizeCompletedMergeUnsafe();
      return null;
    }
    if (existing) return existing;

    const current = readGuestCartUnsafe();
    if (current.length === 0) return null;

    const initial = makeInitialPending(current);
    writePendingMerge(initial);
    return initial;
  });

  if (!pending) return [];

  const outcomes: GuestCartMergeOutcome[] = [];

  while (pending) {
    const currentPending = pending;
    const response = await sendPendingMerge(currentPending.payload);
    outcomes.push(...(response.result?.outcomes ?? []));
    const transition = await withGuestCartLock(() => {
      const storedPending = readPendingMerge();
      if (!storedPending) return { done: true as const };
      if (storedPending.phase === "complete") {
        finalizeCompletedMergeUnsafe();
        return { done: true as const };
      }

      // Another tab may have advanced the same receipt chain. Follow its
      // persisted immutable payload instead of creating a competing branch.
      if (storedPending.payload.mergeId !== currentPending.payload.mergeId) {
        return { pending: storedPending };
      }

      const latest = readGuestCartUnsafe();
      if (sameCartQuantities(latest, storedPending.snapshot)) {
        writePendingMerge({ ...storedPending, phase: "complete" });
        finalizeCompletedMergeUnsafe();
        return { done: true as const };
      }

      const nextPending = makeReconciliationPending(
        latest,
        storedPending.rootMergeId,
        storedPending.payload.mergeId,
        storedPending.affectedProductIds,
      );
      writePendingMerge(nextPending);
      return { pending: nextPending };
    });

    if ("done" in transition) return outcomes;
    pending = transition.pending;
  }

  return outcomes;
}

export function addToGuestCart(product: CartProduct, quantity = 1) {
  return withGuestCartLock(() => {
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > MAX_CART_QUANTITY ||
      !Number.isInteger(product.id) ||
      product.id <= 0
    ) {
      throw new Error("Invalid guest cart item or quantity.");
    }

    finalizeCompletedMergeUnsafe();
    const items = readGuestCartUnsafe();
    const existingItem = items.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + quantity > MAX_CART_QUANTITY) {
        throw new Error("The requested quantity is too large.");
      }
      existingItem.quantity += quantity;
      existingItem.product = product;
    } else {
      items.push({ product, quantity });
    }

    writeGuestCart(items);
    return items;
  });
}

export function removeFromGuestCart(productId: number) {
  return withGuestCartLock(() => {
    finalizeCompletedMergeUnsafe();
    const updatedItems = readGuestCartUnsafe().filter(
      (item) => item.product.id !== productId,
    );
    writeGuestCart(updatedItems);
    return updatedItems;
  });
}

export function updateGuestCartQuantity(productId: number, quantity: number) {
  return withGuestCartLock(() => {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_CART_QUANTITY) {
      throw new Error("Invalid guest cart quantity.");
    }
    finalizeCompletedMergeUnsafe();
    const updatedItems = readGuestCartUnsafe()
      .map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    writeGuestCart(updatedItems);
    return updatedItems;
  });
}

export function mergeGuestCart() {
  if (mergePromise) return mergePromise;
  mergePromise = runMergeGuestCart().finally(() => {
    mergePromise = null;
  });
  return mergePromise;
}

function finalizeCompletedMergeUnsafe() {
  const pending = readPendingMerge();
  if (pending?.phase !== "complete") return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    throw new Error("Cart reconciliation is complete but local cleanup failed.");
  }
  clearPendingMerge();
}

export function clearGuestCart() {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    throw new Error("The guest cart could not be cleared on this device.");
  }
}

export function getGuestCartQuantity() {
  return getGuestCart().reduce((total, item) => total + item.quantity, 0);
}
