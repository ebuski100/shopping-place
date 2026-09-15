"use client";

import { useCallback, useEffect, useState } from "react";

type InventoryTransaction = {
  id: number;
  quantity: number;
  type: string;
  reason: string | null;
  createdAt: string;
};

type InventoryHistoryProps = {
  productId: number;
};

type InventoryResponse = {
  transactions?: InventoryTransaction[];
  error?: string;
};

function formatTransactionType(type: string) {
  const labels: Record<string, string> = {
    RESTOCK: "Restock",
    ADJUSTMENT: "Adjustment",
    DAMAGED: "Damaged",
    RETURN: "Customer Return",
    ORDER: "Order",
  };

  return labels[type] ?? type.replaceAll("_", " ");
}

function getTransactionTypeClass(type: string) {
  const classes: Record<string, string> = {
    RESTOCK: "bg-green-100 text-green-700",

    RETURN: "bg-blue-100 text-blue-700",

    ADJUSTMENT: "bg-purple-100 text-purple-700",

    DAMAGED: "bg-red-100 text-red-700",

    ORDER: "bg-orange-100 text-orange-700",
  };

  return classes[type] ?? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200";
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function InventoryHistory({ productId }: InventoryHistoryProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/inventory`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      let data: InventoryResponse = {};

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load inventory history.");
      }

      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : [],
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory history.",
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadTransactions();

    function handleInventoryUpdated(event: Event) {
      const customEvent = event as CustomEvent<{
        productId?: number;
      }>;

      if (customEvent.detail?.productId === productId) {
        void loadTransactions();
      }
    }

    window.addEventListener("inventory-updated", handleInventoryUpdated);

    return () => {
      window.removeEventListener("inventory-updated", handleInventoryUpdated);
    };
  }, [productId, loadTransactions]);

  return (
    <section className="mt-8 rounded-lg border bg-white dark:bg-gray-900 p-6">
      {/* Header */}

      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold">Inventory History</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track every stock movement for this product.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTransactions()}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Loading */}

      {loading && (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          <div className="h-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
          <div className="h-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        </div>
      )}

      {/* Error */}

      {!loading && error && (
        <div className="rounded-md bg-red-50 p-4">
          <p role="alert" className="text-sm font-medium text-red-700">
            Failed to load inventory history.
          </p>

          <p className="mt-1 text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => void loadTransactions()}
            className="mt-3 rounded-md border border-red-200 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}

      {!loading && !error && transactions.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            No inventory transactions yet.
          </p>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Stock movements will appear here once inventory is updated.
          </p>
        </div>
      )}

      {/* Transaction table */}

      {!loading && !error && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-sm font-semibold">
                  Date
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-sm font-semibold">
                  Type
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                  Quantity
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Reason
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {transactions.map((transaction) => {
                const isIncrease = transaction.quantity > 0;

                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {/* Date */}

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </td>

                    {/* Type */}

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTransactionTypeClass(
                          transaction.type,
                        )}`}
                      >
                        {formatTransactionType(transaction.type)}
                      </span>
                    </td>

                    {/* Quantity */}

                    <td
                      className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                        isIncrease ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isIncrease ? "+" : ""}
                      {transaction.quantity}
                    </td>

                    {/* Reason */}

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {transaction.reason || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
