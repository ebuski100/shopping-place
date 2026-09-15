"use client";

type TopCustomer = {
  customerId: number;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpent: number;
};

type TopCustomersProps = {
  data: TopCustomer[];
};

export default function TopCustomers({ data }: TopCustomersProps) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Top Customers</h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customers who have generated the most revenue.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No customer sales data available.
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((customer, index) => (
            <div key={customer.customerId} className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-semibold">
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                {(
                  customer.name?.charAt(0) || customer.email.charAt(0)
                ).toUpperCase()}
              </div>

              {/* Customer information */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {customer.name || "Unnamed customer"}
                </p>

                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {customer.email}
                </p>

                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {customer.orderCount}{" "}
                  {customer.orderCount === 1 ? "order" : "orders"}
                </p>
              </div>

              {/* Spending */}
              <div className="text-right">
                <p className="font-semibold">
                  ₦{customer.totalSpent.toLocaleString("en-NG")}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total spent</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
