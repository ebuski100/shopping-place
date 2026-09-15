"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type InventoryAdjusterProps = {
  productId: number;
  currentStock: number;
};

type TransactionType = "RESTOCK" | "ADJUSTMENT" | "DAMAGED" | "RETURN";

const transactionOptions: {
  value: TransactionType;
  label: string;
}[] = [
  {
    value: "RESTOCK",
    label: "Restock",
  },
  {
    value: "ADJUSTMENT",
    label: "Manual Adjustment",
  },
  {
    value: "DAMAGED",
    label: "Damaged",
  },
  {
    value: "RETURN",
    label: "Customer Return",
  },
];

function getSignedQuantity(
  type: TransactionType,
  quantity: number,
  adjustmentDirection: "increase" | "decrease",
) {
  if (type === "DAMAGED") {
    return -quantity;
  }

  if (type === "RESTOCK" || type === "RETURN") {
    return quantity;
  }

  return adjustmentDirection === "increase" ? quantity : -quantity;
}

export default function InventoryAdjuster({
  productId,
  currentStock,
}: InventoryAdjusterProps) {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>("RESTOCK");

  const [adjustmentDirection, setAdjustmentDirection] = useState<
    "increase" | "decrease"
  >("increase");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericQuantity = Number(quantity);

  const isValidQuantity =
    Number.isInteger(numericQuantity) && numericQuantity > 0;

  const signedQuantity = isValidQuantity
    ? getSignedQuantity(type, numericQuantity, adjustmentDirection)
    : 0;

  const newStock = currentStock + signedQuantity;

  const canDecreaseStock =
    signedQuantity >= 0 || Math.abs(signedQuantity) <= currentStock;

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);

    if (nextType !== "ADJUSTMENT") {
      setAdjustmentDirection("increase");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!isValidQuantity) {
      setError("Enter a valid quantity greater than 0.");
      return;
    }

    if (!canDecreaseStock) {
      setError("Stock cannot be reduced below 0.");
      return;
    }

    if (reason.trim().length > 500) {
      setError("Reason cannot exceed 500 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/inventory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: signedQuantity,
            type,
            reason: reason.trim() || undefined,
          }),
        },
      );

      let data: {
        error?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        // Keep the generic error below if the
        // server does not return valid JSON.
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to update inventory.");
      }

      setQuantity("");
      setReason("");
      setError("");

      /*
       * Refresh server components so the displayed
       * product stock becomes the server's latest value.
       */
      router.refresh();

      /*
       * Notify InventoryHistory so it can reload
       * the transaction list without requiring a
       * full page navigation.
       */
      window.dispatchEvent(
        new CustomEvent("inventory-updated", {
          detail: {
            productId,
          },
        }),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  const isAdjustment = type === "ADJUSTMENT";

  const isDecrease = signedQuantity < 0;

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
      {/* Header */}

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Inventory</h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage the available stock for this product.
        </p>
      </div>

      {/* Current stock */}

      <div className="mb-6 rounded-lg bg-gray-50 dark:bg-gray-950 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">Current stock</p>

        <p className="mt-1 text-3xl font-bold">{currentStock}</p>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {currentStock === 1 ? "unit" : "units"} available
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Action */}

        <div>
          <label
            htmlFor="inventory-type"
            className="mb-2 block text-sm font-medium"
          >
            Action
          </label>

          <select
            id="inventory-type"
            value={type}
            onChange={(event) =>
              handleTypeChange(event.target.value as TransactionType)
            }
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {transactionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Adjustment direction */}

        {isAdjustment && (
          <div>
            <label
              htmlFor="inventory-direction"
              className="mb-2 block text-sm font-medium"
            >
              Adjustment
            </label>

            <select
              id="inventory-direction"
              value={adjustmentDirection}
              onChange={(event) =>
                setAdjustmentDirection(
                  event.target.value as "increase" | "decrease",
                )
              }
              disabled={loading}
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="increase">Increase stock</option>

              <option value="decrease">Decrease stock</option>
            </select>
          </div>
        )}

        {/* Quantity */}

        <div>
          <label
            htmlFor="inventory-quantity"
            className="mb-2 block text-sm font-medium"
          >
            Quantity
          </label>

          <input
            id="inventory-quantity"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Enter quantity"
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Reason */}

        <div>
          <label
            htmlFor="inventory-reason"
            className="mb-2 block text-sm font-medium"
          >
            Reason
          </label>

          <input
            id="inventory-reason"
            type="text"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={
              type === "RESTOCK"
                ? "e.g. New supplier shipment"
                : type === "DAMAGED"
                  ? "e.g. Product damaged in warehouse"
                  : type === "RETURN"
                    ? "e.g. Customer returned item"
                    : "e.g. Stock count correction"
            }
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50"
          />

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{reason.length}/500</p>
        </div>

        {/* Preview */}

        <div className="rounded-md border bg-gray-50 dark:bg-gray-950 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Stock change</p>

            {isValidQuantity && (
              <p
                className={`text-sm font-semibold ${
                  isDecrease ? "text-red-600" : "text-green-600"
                }`}
              >
                {isDecrease ? "-" : "+"}
                {Math.abs(signedQuantity)}
              </p>
            )}
          </div>

          <p className="mt-2 text-xl font-semibold">
            {newStock} {newStock === 1 ? "unit" : "units"}
          </p>

          {isValidQuantity && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {currentStock} → {newStock}
            </p>
          )}
        </div>

        {/* Client-side warning */}

        {isValidQuantity && !canDecreaseStock && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            You cannot reduce stock below zero.
          </div>
        )}

        {/* Error */}

        {error && (
          <div
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Submit */}

        <button
          type="submit"
          disabled={loading || !isValidQuantity || !canDecreaseStock}
          className="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Stock"}
        </button>
      </form>
    </div>
  );
}
