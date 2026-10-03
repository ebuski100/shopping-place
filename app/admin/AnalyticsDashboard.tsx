"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import RevenueChart from "./RevenueChart";
import OrdersByStatus from "./OrderByStatus";
import TopProducts from "./TopProducts";
import TopCustomers from "./TopCustomers";
import RecentOrders from "./RecentOrders";

import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";

type AnalyticsRange = "7d" | "30d" | "90d" | "all";
type OrdersByStatusData = Record<string, number>;

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
  ordersByStatus: OrdersByStatusData;
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  recentOrders: RecentOrder[];
  error?: string;
};

type DashboardCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  accent: "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan";
};

const numberFormatter = new Intl.NumberFormat("en-NG");

function formatCurrency(amount: number) {
  return `₦${numberFormatter.format(amount)}`;
}

function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: DashboardCardProps) {
  const accentStyles = {
    blue: {
      icon: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      indicator: "bg-blue-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
      indicator: "bg-violet-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      indicator: "bg-emerald-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      indicator: "bg-amber-500",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
      indicator: "bg-rose-500",
    },
    cyan: {
      icon: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
      indicator: "bg-cyan-500",
    },
  }[accent];

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentStyles.icon}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${accentStyles.indicator}`}
        />
        <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
        />
      ))}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatusData>({});
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/analytics?range=${range}`, {
          method: "GET",
          cache: "no-store",
          signal,
          headers: {
            Accept: "application/json",
          },
        });

        const data = (await response.json()) as AnalyticsResponse;

        if (!response.ok) {
          throw new Error(data.error || "Unable to load analytics.");
        }

        setOverview(data.overview);
        setRevenue(data.revenue);
        setOrdersByStatus(data.ordersByStatus);
        setTopProducts(data.topProducts);
        setTopCustomers(data.topCustomers);
        setRecentOrders(data.recentOrders);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading analytics.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [range],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetchAnalytics(controller.signal);

    return () => controller.abort();
  }, [fetchAnalytics, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  return (
    <main className="min-w-0 space-y-6 pb-8 sm:space-y-8">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Store overview
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl dark:text-white">
            Dashboard
          </h1>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Monitor revenue, orders, customers, and inventory.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 min-[420px]:flex-row sm:w-auto">
          <label htmlFor="analytics-range" className="sr-only">
            Analytics date range
          </label>

          <select
            id="analytics-range"
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsRange)}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 min-[420px]:min-w-36 sm:flex-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-gray-500 dark:focus:ring-gray-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <section
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                Unable to load analytics
              </p>
              <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </section>
      )}

      {/* Loading state */}
      {loading && !overview && <DashboardSkeleton />}

      {/* Dashboard content */}
      {!error && !loading && overview && (
        <>
          {/* Key metrics */}
          <section aria-label="Store metrics">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Key metrics
              </h2>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                {range === "all"
                  ? "All time"
                  : `Last ${range.replace("d", " days")}`}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              <DashboardCard
                title="Total revenue"
                value={formatCurrency(overview.totalRevenue)}
                description="Revenue from paid orders"
                icon={Wallet}
                accent="emerald"
              />

              <DashboardCard
                title="Total orders"
                value={numberFormatter.format(overview.totalOrders)}
                description="Orders in the selected period"
                icon={ShoppingCart}
                accent="blue"
              />

              <DashboardCard
                title="Total customers"
                value={numberFormatter.format(overview.totalCustomers)}
                description="Registered customers"
                icon={Users}
                accent="violet"
              />

              <DashboardCard
                title="Active products"
                value={numberFormatter.format(overview.totalProducts)}
                description="Products available in your store"
                icon={Boxes}
                accent="cyan"
              />

              <DashboardCard
                title="Pending orders"
                value={numberFormatter.format(overview.pendingOrders)}
                description="Orders awaiting processing"
                icon={Activity}
                accent="amber"
              />

              <DashboardCard
                title="Low stock"
                value={numberFormatter.format(overview.lowStockProducts)}
                description="Products with 5 or fewer items"
                icon={AlertTriangle}
                accent="rose"
              />
            </div>
          </section>

          {/* Revenue chart */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-950 dark:text-white">
                Revenue overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Revenue trends for the selected period.
              </p>
            </div>

            <div className="min-w-0">
              <RevenueChart data={revenue} />
            </div>
          </section>

          {/* Orders and products */}
          <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-5 text-base font-semibold text-gray-950 dark:text-white">
                Orders by status
              </h2>
              <div className="min-w-0">
                <OrdersByStatus data={ordersByStatus} />
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-5 text-base font-semibold text-gray-950 dark:text-white">
                Top products
              </h2>
              <div className="min-w-0">
                <TopProducts data={topProducts} />
              </div>
            </div>
          </section>

          {/* Customers */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-950 dark:text-white">
                  Top customers
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customer spending and order activity.
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <TopCustomers data={topCustomers} />
            </div>
          </section>

          {/* Recent orders */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-950 dark:text-white">
                  Recent orders
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Latest activity from your store.
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <RecentOrders orders={recentOrders} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
