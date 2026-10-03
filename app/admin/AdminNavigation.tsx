"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Menu,
  X,
  Store,
} from "lucide-react";

type AdminNavigationProps = {
  email: string;
  children: React.ReactNode;
};

const navigationItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
];

export default function AdminNavigation({
  email,
  children,
}: AdminNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile top bar */}{" "}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 md:hidden">
        {" "}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            aria-controls="admin-sidebar"
            aria-expanded={isOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {" "}
            <Menu size={21} />{" "}
          </button>

          <div>
            <p className="text-base font-bold tracking-tight">Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Store management
            </p>
          </div>
        </div>
        <Store
          size={21}
          className="text-gray-500 dark:text-gray-400"
          aria-hidden="true"
        />
      </header>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-gray-950/60 backdrop-blur-[2px] md:hidden"
        />
      )}
      {/* Sidebar / mobile drawer */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 md:z-20 md:w-64 md:translate-x-0 md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar heading */}
        <div className="flex min-h-20 items-center justify-between border-b border-gray-200 px-5 dark:border-gray-800">
          <Link
            href="/admin"
            onClick={closeMenu}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
              <Store size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="max-w-[155px] truncate text-xs text-gray-500 dark:text-gray-400">
                {email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            Workspace
          </p>

          {navigationItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  className={
                    active
                      ? "shrink-0"
                      : "shrink-0 text-gray-400 transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-200"
                  }
                />

                <span>{label}</span>

                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-900" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
            <span>Back to store</span>
          </Link>
        </div>
      </aside>
      {/* Page content */}
      <main className="min-w-0 md:ml-64">{children}</main>
    </>
  );
}
