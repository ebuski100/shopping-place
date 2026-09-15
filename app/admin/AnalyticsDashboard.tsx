"use client";

import { useEffect, useState } from "react";
import RevenueChart from "./RevenueChart";
import OrdersByStatus from "./OrderByStatus";
import TopProducts from "./TopProducts";
import TopCustomers from "./TopCustomers";
import RecentOrders from "./RecentOrders";
import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
type AnalyticsRange = "7d" | "30d" | "90d" | "all";
type OrdersByStatus = Record<string, number>;
// type AnalyticsDashboardProps = {
//   recentOrders: RecentOrder[];
// };
type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
};

type RevenueData = {
  date: string;
  amount: number;
};

type TopProduct = {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
};

type RecentOrder = {
  id: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  fullName: string;
  user: {
    name: string | null;
    email: string;
  };
};
type TopCustomer = {
  customerId: number;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpent: number;
};

type AnalyticsResponse = {
  overview: AnalyticsOverview;
  revenue: RevenueData[];
  ordersByStatus: OrdersByStatus;
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  recentOrders: RecentOrder[];

  error?: string;
};

type DashboardCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

// function DashboardCard({ title, value, description }: DashboardCardProps) {
//   return (
//     <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
//       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>

//       <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>

//       {description && (
//         <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
//       )}
//     </div>
//   );
// }

function DashboardCard({ title, value, description }: DashboardCardProps) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>

      {description && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus>({});
  const [revenue, setRevenue] = useState<RevenueData[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/admin/analytics?range=${range}`);

        const data: AnalyticsResponse & {
          error?: string;
        } = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch analytics");
        }

        setOverview(data.overview);
        setRevenue(data.revenue);
        setOrdersByStatus(data.ordersByStatus);

        setTopProducts(data.topProducts);
        setTopCustomers(data.topCustomers);
        setRecentOrders(data.recentOrders);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch analytics",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [range]);

  return (
    <div className="space-y-8">
      {/* Dashboard header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>

          <p className="mt-1 text-gray-500 dark:text-gray-400">Monitor your store performance.</p>
        </div>

        {/* Date range */}
        <div>
          <label htmlFor="analytics-range" className="sr-only">
            Analytics date range
          </label>

          <select
            id="analytics-range"
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsRange)}
            disabled={loading}
            className="rounded-md border bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black"
          >
            <option value="7d">Last 7 days</option>

            <option value="30d">Last 30 days</option>

            <option value="90d">Last 90 days</option>

            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">Failed to load analytics</p>

          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      )}

      {/* Cards */}
      {!loading && !error && overview && (
        <div className="grid gap-4 sm:grid-cols-2  lg:grid-cols-3">
          <DashboardCard
            title="Total Revenue"
            value={`₦${overview.totalRevenue.toLocaleString("en-NG")}`}
            description="Revenue from paid orders"
          />

          <DashboardCard
            title="Total Orders"
            value={overview.totalOrders}
            description="Orders in selected period"
          />

          <DashboardCard
            title="Total Customers"
            value={overview.totalCustomers}
            description="Registered customers"
          />

          <DashboardCard
            title="Total Products"
            value={overview.totalProducts}
            description="Active products"
          />

          <DashboardCard
            title="Pending Orders"
            value={overview.pendingOrders}
            description="Orders waiting for processing"
          />

          <DashboardCard
            title="Low Stock"
            value={overview.lowStockProducts}
            description="Products with 5 or fewer items"
          />
        </div>
      )}

      {!loading && !error && overview && (
        <>
          <RevenueChart data={revenue} />

          <div className="grid gap-6 lg:grid-cols-2">
            <OrdersByStatus data={ordersByStatus} />

            <TopProducts data={topProducts} />
          </div>

          <TopCustomers data={topCustomers} />
          <RecentOrders orders={recentOrders} />
        </>
      )}
    </div>
  );
}
