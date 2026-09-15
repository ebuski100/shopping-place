"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { mergeGuestCart } from "@/lib/guestCart";
import GoBack from "@/components/GoBack";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [socialLoading, setSocialLoading] = useState<
    "google" | "github" | null
  >(null);

  useEffect(() => {
    const resetSocialLoading = () => {
      setSocialLoading(null);
    };

    window.addEventListener("pageshow", resetSocialLoading);

    return () => {
      window.removeEventListener("pageshow", resetSocialLoading);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to login");
        return;
      }

      try {
        await mergeGuestCart();
      } catch (error) {
        console.error("Guest cart merge failed:", error);
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-2 flex w-full max-w-md items-center gap-2">
        <GoBack />

        <h1 className="mb-2 text-3xl font-bold">Login</h1>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/30 p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 outline-none focus:ring-1"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-2 block font-medium">
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 pr-12 outline-none focus:ring-1"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 transition hover:text-gray-900 dark:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-black py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />

          <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>

          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={socialLoading !== null}
            onClick={() => {
              setSocialLoading("google");
              window.location.href = "/api/auth/google";
            }}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {socialLoading === "google" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <img src="/google.png" alt="" height={25} width={25} />
                Continue with Google
              </>
            )}
          </button>

          <button
            type="button"
            disabled={socialLoading !== null}
            onClick={() => {
              setSocialLoading("github");
              window.location.href = "/api/auth/github";
            }}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {socialLoading === "github" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting to GitHub...
              </>
            ) : (
              <>
                <img src="/Github.png" alt="" height={25} width={25} />
                Continue with GitHub
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-2  pt-2 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Don&apos;t have an account?</p>

        <a
          href="/register"
          className="mt-1 inline-block font-semibold text-green-600 transition hover:text-green-700 hover:underline"
        >
          Create an account
        </a>
      </div>
    </main>
  );
}
