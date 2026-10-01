import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

import WishlistInitializer from "@/components/WishlistInitializer";
import ThemeInitializer from "@/components/ThemeInitializer";
import ProductRatingsLoader from "@/components/products/ProductRatingsLoader";

export const metadata: Metadata = {
  title: "ecommerce app",
  description: "A MarketPlace made available for both buyers and Sellers",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body className="min-h-full flex w-full max-w-7xl flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <ProductRatingsLoader />

        <WishlistInitializer />

        <ThemeInitializer />

        {children}

        <Toaster position="bottom-left" richColors closeButton />
      </body>
    </html>
  );
}
