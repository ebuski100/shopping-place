import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";

import WishlistInitializer from "@/components/WishlistInitializer";
import ThemeInitializer from "@/components/ThemeInitializer";
import ProductRatingsLoader from "@/components/products/ProductRatingsLoader";
import { PwaInstallProvider } from "@/components/PwaInstall";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import type { ReactNode } from "react";
export const metadata: Metadata = {
  title: "Shopping Place",
  description: "Shop products online with Shopping Place.",
  icons: {
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Shopping Place",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body className="min-h-full flex w-full max-w-7xl flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <ProductRatingsLoader />

        <WishlistInitializer />

        <ThemeInitializer />

        <ServiceWorkerRegistration />

        <PwaInstallProvider>{children}</PwaInstallProvider>

        <Toaster position="bottom-left" richColors closeButton />
      </body>
    </html>
  );
}
