"use client";

type OrdersByStatusProps = {
  data: Record<string, number>;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  PROCESSING: "bg-purple-500",
  SHIPPED: "bg-indigo-500",
  OUT_FOR_DELIVERY: "bg-orange-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

export default function OrdersByStatus({ data }: OrdersByStatusProps) {
  const statuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];

  const totalOrders = Object.values(data).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Orders by Status</h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Distribution of orders across their current statuses.
        </p>
      </div>

      {totalOrders === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No order data available.
        </div>
      ) : (
        <div className="space-y-5">
          {statuses.map((status) => {
            const count = data[status] ?? 0;

            const percentage =
              totalOrders === 0 ? 0 : (count / totalOrders) * 100;

            return (
              <div key={status}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {statusLabels[status]}
                  </span>

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count} {count === 1 ? "order" : "orders"} (
                    {percentage.toFixed(0)}%)
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      statusClasses[status]
                    }`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
