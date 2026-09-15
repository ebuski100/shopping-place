"use client";

type TopProduct = {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
};

type TopProductsProps = {
  data: TopProduct[];
};

export default function TopProducts({ data }: TopProductsProps) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Top Products</h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Best-selling products by units sold.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No product sales data available.
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((product, index) => (
            <div key={product.productId} className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-semibold">
                {index + 1}
              </div>

              {/* Product information */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{product.productName}</p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {product.unitsSold}{" "}
                  {product.unitsSold === 1 ? "unit" : "units"} sold
                </p>
              </div>

              {/* Revenue */}
              <div className="text-right">
                <p className="font-semibold">
                  ₦{product.revenue.toLocaleString("en-NG")}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
