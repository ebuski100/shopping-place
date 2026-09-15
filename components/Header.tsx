"use client";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Search,
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  Menu,
  X,
} from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  const isProductsPage = pathname === "/products";

  useEffect(() => {
    async function getUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      setUser(null);
      setMobileMenuOpen(false);

      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full  bg-white dark:bg-gray-900 px-4 ">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between py-2 ">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight flex text-green-600"
        >
          <img src="/shopping-bag.png" height={30} width={30} alt="" />
          <span className="hidden md:block">marketPlace</span>
        </Link>

        {/* Desktop Navigation */}

        {/* Search */}
        <div className="mx-4 max-w-md flex-1 md:block">
          {isProductsPage ? (
            <form action="/products" method="GET" className="flex flex-1">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>

              <input
                id="product-search"
                type="search"
                name="search"
                placeholder="Search products..."
                defaultValue=""
                className="w-full rounded-full  bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm outline-none "
              />
            </form>
          ) : (
            <Link
              href="/products"
              className="flex flex-1 items-center rounded-full  bg-gray-100 dark:bg-gray-800  px-4 py-2 text-sm text-gray-600 dark:text-gray-300 transition hover:text-gray-500 dark:text-gray-400 "
            >
              <Search
                size={18}
                className="text-gray-400 dark:text-gray-500 mr-3"
              />
              Search products...
            </Link>
          )}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/cart"
            className="relative text-gray-700 dark:text-gray-200 transition hover:text-green-600"
            aria-label="Cart"
          >
            <ShoppingCart size={22} />
          </Link>

          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogIn size={18} />
                Login
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                <UserPlus size={18} />
                Register
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="flex items-center gap-2 text-sm font-medium transition hover:text-green-600"
              >
                <User size={20} />
                {user.name}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>

              {user && <NotificationBell />}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-md p-2 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            ref={mobileMenuRef}
            className=" absolute top-3 z-50 mt-11 w-full rounded-2xl left-10   bg-white dark:bg-gray-900 px-4 py-5 md:hidden  shadow-[0_6px_12px_-4px_rgba(0,0,0,0.18)]"
          >
            <nav className="flex flex-col gap-4 border-b border-gray-500 dark:border-gray-700">
              {!loading && !user && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 font-medium"
                  >
                    <LogIn size={18} />
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 font-medium mb-3"
                  >
                    <UserPlus size={18} />
                    Register
                  </Link>
                </>
              )}

              {!loading && user && (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 font-medium"
                  >
                    <User size={18} />
                    Hi,{user.name}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-left font-medium text-red-500 "
                  >
                    <LogOut size={18} />
                    Logout
                  </button>

                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300  mb-2"
                  >
                    <Settings size={18} />
                    settings
                  </Link>
                </>
              )}
            </nav>

            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2  text-gray-600 dark:text-gray-300 mt-3"
            >
              Help Center
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2  text-gray-600 dark:text-gray-300 mt-3"
            >
              Return & refund Policy
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2  text-gray-600 dark:text-gray-300 mt-3"
            >
              Disputes & Reports
            </Link>
          </div>
        </>
      )}
    </header>
  );
}
