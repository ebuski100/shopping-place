"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Home, User, ShoppingCart, Heart, ShoppingBag } from "lucide-react";

import { useStoreCounts } from "@/lib/store/useStoreCounts";

const Footer = () => {
  const pathname = usePathname();

  const {
    cartCount,
    wishlistCount,
    orderCount,
    loadCartCount,
    loadOrderCount,
  } = useStoreCounts();

  useEffect(() => {
    loadCartCount();
    loadOrderCount();
  }, [loadCartCount, loadOrderCount]);

  const footerItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "WishList",
      href: "/wishlist",
      icon: Heart,
      count: wishlistCount,
    },

    {
      name: "Cart",
      href: "/cart",
      icon: ShoppingCart,
      count: cartCount,
    },
    {
      name: "Orders",
      href: "/orders",
      icon: ShoppingBag,
      count: orderCount,
    },
    {
      name: "Account",
      href: "/account",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-white dark:bg-gray-900 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      <div className="flex flex-row justify-between p-4">
        {footerItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-1 items-center justify-center text-xs ${
                isActive ? "text-green-600" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <div className="relative flex flex-col items-center hover:text-green-500">
                <div className="relative">
                  <Icon
                    size={22}
                    className={isActive ? "text-green-600" : ""}
                  />

                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </div>

                <span className={isActive ? "text-green-600" : ""}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Footer;
