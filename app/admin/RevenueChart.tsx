"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenueData = {
  date: string;
  amount: number;
};

type RevenueChartProps = {
  data: RevenueData[];
};

export default function RevenueChart({ data }: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    label: new Date(`${item.date}T00:00:00`).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    }),
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Revenue Overview</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Revenue from paid orders</p>
        </div>

        <p className="text-2xl font-bold">
          ₦{totalRevenue.toLocaleString("en-NG")}
        </p>
      </div>

      {/* Chart */}
      <div className="h-[350px] w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No revenue data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{
                top: 10,
                right: 20,
                left: 70,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) =>
                  `₦${Number(value).toLocaleString("en-NG")}`
                }
              />

              <Tooltip
                formatter={(value) => [
                  `₦${Number(value).toLocaleString("en-NG")}`,
                  "Revenue",
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Area
                type="monotone"
                dataKey="amount"
                strokeWidth={2}
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
