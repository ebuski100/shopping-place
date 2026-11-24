import type { ReactNode } from "react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`motion-safe:animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  );
}

function LoadingRegion({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section aria-busy="true" aria-label={label} className="min-h-[55vh]">
      <p role="status" className="sr-only">Loading {label.toLowerCase()}…</p>
      {children}
    </section>
  );
}

function ProductCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
      <SkeletonBlock className="aspect-square rounded-none" />
      <div className="space-y-3 p-3">
        <SkeletonBlock className="h-3 w-1/3 rounded-full" />
        <SkeletonBlock className="h-5 w-4/5 rounded-md" />
        <SkeletonBlock className="h-4 w-2/5 rounded-md" />
        <SkeletonBlock className="h-9 w-full rounded-lg" />
      </div>
    </article>
  );
}

function HeaderSkeleton() {
  return (
    <header aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
        <SkeletonBlock className="h-9 w-36" />
        <SkeletonBlock className="h-10 max-w-md flex-1 rounded-full" />
        <div className="flex gap-3"><SkeletonBlock className="h-9 w-9 rounded-full" /><SkeletonBlock className="h-9 w-24 rounded-lg" /></div>
      </div>
    </header>
  );
}

export function HomeLoading() {
  return (
    <LoadingRegion label="Shopping Place">
      <HeaderSkeleton />
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 pt-20 sm:px-6">
        <SkeletonBlock className="h-48 w-full rounded-2xl sm:h-64" />
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-9 w-28 rounded-full" />
        </div>
        <ProductGrid />
      </main>
    </LoadingRegion>
  );
}

export function ProductListingLoading() {
  return (
    <LoadingRegion label="Product catalogue">
      <HeaderSkeleton />
      <main className="min-h-[70vh] bg-gray-50 pt-20 dark:bg-gray-950">
        <div className="flex min-h-[calc(100vh-4rem)]">
          <aside aria-hidden="true" className="hidden w-52 shrink-0 space-y-4 border-r border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:block lg:w-60">
            <SkeletonBlock className="h-5 w-28" />
            {Array.from({ length: 7 }, (_, index) => <SkeletonBlock key={index} className="h-9 w-full rounded-lg" />)}
          </aside>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <SkeletonBlock className="mb-6 h-7 w-52" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3">
            {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          </div>
        </div>
      </main>
    </LoadingRegion>
  );
}

function ProductGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
    </div>
  );
}

export function ProductDetailLoading() {
  return (
    <LoadingRegion label="Product details">
      <HeaderSkeleton />
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <SkeletonBlock className="aspect-square w-full rounded-2xl" />
          <div className="space-y-5 py-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-9 w-4/5" />
            <SkeletonBlock className="h-6 w-1/3" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-10 w-40" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </LoadingRegion>
  );
}

export function CartLoading() {
  return (
    <LoadingRegion label="Your cart">
      <header aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6"><SkeletonBlock className="h-10 w-10 rounded-full" /><SkeletonBlock className="h-6 w-40" /></div>
      </header>
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 pt-24 sm:px-6">
        <SkeletonBlock className="h-8 w-44" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
            <SkeletonBlock className="h-24 w-24 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-1">
              <SkeletonBlock className="h-5 w-2/3" />
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-9 w-32 rounded-xl" />
            </div>
          </div>
        ))}
        <SkeletonBlock className="ml-auto h-12 w-52 rounded-xl" />
      </main>
    </LoadingRegion>
  );
}

export function WishlistLoading() {
  return (
    <LoadingRegion label="Wishlist">
      <main className="mx-auto min-h-[60vh] max-w-7xl space-y-6 px-4 py-8">
        <SkeletonBlock className="h-8 w-44" />
        <ProductGrid />
      </main>
    </LoadingRegion>
  );
}

export function DashboardLoading() {
  return (
    <LoadingRegion label="Dashboard">
      <main className="min-h-screen bg-gray-50 p-5 pt-8 dark:bg-gray-950 sm:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-56" />
            <SkeletonBlock className="h-4 w-72" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="h-28 rounded-2xl" />)}
          </div>
          <SkeletonBlock className="h-72 rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonBlock className="h-56 rounded-2xl" />
            <SkeletonBlock className="h-56 rounded-2xl" />
          </div>
        </div>
      </main>
    </LoadingRegion>
  );
}

export function AccountLoading() {
  return (
    <LoadingRegion label="Account">
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <SkeletonBlock className="h-9 w-44" />
        <div className="flex items-center gap-5 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
          <SkeletonBlock className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3"><SkeletonBlock className="h-5 w-48" /><SkeletonBlock className="h-4 w-64" /></div>
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </main>
    </LoadingRegion>
  );
}

export function FormLoading({ label = "Form" }: { label?: string }) {
  return (
    <LoadingRegion label={label}>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <SkeletonBlock className="h-8 w-56" />
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <SkeletonBlock className="h-12 w-full rounded-xl sm:w-56" />
        </div>
      </main>
    </LoadingRegion>
  );
}

export function ListLoading({ label = "Items" }: { label?: string }) {
  return (
    <LoadingRegion label={label}>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
        <SkeletonBlock className="h-8 w-52" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <div className="flex-1 space-y-3"><SkeletonBlock className="h-5 w-40" /><SkeletonBlock className="h-4 w-56" /></div>
            <SkeletonBlock className="h-8 w-24 rounded-full" />
          </div>
        ))}
      </main>
    </LoadingRegion>
  );
}
