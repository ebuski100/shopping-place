"use client";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useWishlistStore } from "@/lib/store/useWishlistStore";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useCartStore } from "@/lib/store/useCartStore";
type User = {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
};

function getInitials(name: string | null) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const wishlistItems = useWishlistStore((state) => state.items);
  const cartItems = useCartStore((state) => state.items);
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
    <header className="fixed top-0 z-50 left-0 right-0 w-full border-b border-gray-200  bg-white dark:bg-gray-900 px-4 ">
      <div className=" flex h-16 max-w-7xl items-center justify-between py-2 ">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight flex text-green-600"
        >
          <Image src="/shopping-bag.png" alt="" width={30} height={30} />
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
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/wishlist"
              className="relative text-gray-700 transition hover:text-green-600 dark:text-gray-200"
              aria-label="Wishlist"
            >
              <Heart size={22} />

              {wishlistItems.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white">
                  {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative text-gray-700 transition hover:text-green-600 dark:text-gray-200"
              aria-label="Cart"
            >
              <ShoppingCart size={22} />

              {cartItems.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white">
                  {cartItems.length > 99 ? "99+" : cartItems.length}
                </span>
              )}
            </Link>
          </div>

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
              <div className="group relative">
                {/* Account trigger */}
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.name ?? "Profile"}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>

                  <span>{user.name}</span>

                  <ChevronDown
                    size={16}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </Link>

                {/* Dropdown */}
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 translate-y-2 rounded-xl border border-gray-200 bg-white p-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900">
                  <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.name}
                    </p>

                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>

                  <nav className="mt-1">
                    <Link
                      href="/orders"
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      My Orders
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Settings
                    </Link>

                    <Link
                      href="/help"
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Help Center
                    </Link>

                    <Link
                      href="/disputes"
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Disputes & Reports
                    </Link>
                  </nav>

                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut size={17} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>

              {user && <NotificationBell />}
            </div>
          )}
        </div>
        <div className="flex  md:hidden">{user && <NotificationBell />}</div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-md cursor-pointer p-2 md:hidden"
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
                    className="flex items-center gap-2 font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
                  >
                    <LogIn size={18} />
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 font-medium mb-3 transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
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
                    className="flex items-center gap-2 font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt={user.name ?? "Profile"}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    Hi, {user.name}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-left font-medium text-red-500 transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>

                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl  mb-2"
                  >
                    <Settings size={18} />
                    settings
                  </Link>
                </>
              )}
            </nav>

            <Link
              href="/help"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2  text-gray-600 dark:text-gray-300 mt-3 transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
            >
              Help Center
            </Link>
            <Link
              href="/return-refunds"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2  text-gray-600 dark:text-gray-300 mt-3 transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
            >
              Return & refund Policy
            </Link>
            <Link
              href="/disputes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2  text-gray-600 dark:text-gray-300 mt-3 transition hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl"
            >
              Disputes & Reports
            </Link>
          </div>
        </>
      )}
    </header>
  );
}
