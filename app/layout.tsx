import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import WishlistInitializer from "@/components/WishlistInitializer";
import ThemeInitializer from "@/components/ThemeInitializer";
// import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ecommerce app",
  description: "A MarketPlace made available for both buyers and Sellers",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem("theme");
                if (theme === "dark") {
                  document.documentElement.classList.add("dark");
                } else if (theme === "light") {
                  document.documentElement.classList.remove("dark");
                } else if (
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                ) {
                  document.documentElement.classList.add("dark");
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <WishlistInitializer />
        <ThemeInitializer />

        {children}

        <Toaster position="bottom-left" richColors closeButton />

        {/* <Footer /> */}
      </body>
    </html>
  );
}
