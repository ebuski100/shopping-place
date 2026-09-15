"use client";

import Link from "next/link";
import {
  ArrowRight,
  Heart,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import GoBack from "@/components/GoBack";

type AccountUser = {
  id: number;
  name: string | null;
  email: string;
  profileImage?: string | null;
  role: "CUSTOMER" | "ADMIN";
};

type AccountClientProps = {
  user: AccountUser;
};

export default function AccountClient({ user }: AccountClientProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [profileImage, setProfileImage] = useState(user.profileImage ?? "");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update account");
      }

      setMessage("Account updated successfully.");
      setEditing(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/account/profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload profile picture");
      }

      setProfileImage(data.profileImage);
      setMessage("Profile picture updated.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/");
      router.refresh();
    } catch {
      setError("Failed to log out.");
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
      setDeleting(false);
    }
  }

  const initial =
    user.name?.trim().charAt(0).toUpperCase() ||
    user.email.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 pb-32">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex ">
          <div className="mr-3">
            <GoBack />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your profile and account settings.
            </p>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-900"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="rounded-xl border border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {initial}
                </div>
              )}

              <label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
              >
                {uploading ? "..." : "Edit"}
              </label>

              <input
                id="profile-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">
                {user.name || "Welcome"}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

              <p className="mt-2 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {user.role}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Personal information</h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update your basic account information.
              </p>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-gray-500 dark:border-gray-700 cursor-pointer px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!editing || saving}
                className="w-full rounded-md border border-gray-600 px-4 py-3 outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 dark:bg-gray-950"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-md border bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-500 dark:text-gray-400"
              />

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email changes will require verification.
              </p>
            </div>

            {editing && (
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setName(user.name ?? "");
                    setEditing(false);
                  }}
                  disabled={saving}
                  className="rounded-md border px-5 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <AccountLink
            href="/orders"
            icon={<ShoppingBag size={20} />}
            title="My Orders"
            description="View your orders and delivery status."
          />

          <AccountLink
            href="/wishlist"
            icon={<Heart size={20} />}
            title="Wishlist"
            description="View products you've saved."
          />

          <AccountLink
            href="/cart"
            icon={<ShoppingCart size={20} />}
            title="Shopping Cart"
            description="View items currently in your cart."
          />
        </section>

        <section className="mt-6 rounded-xl border border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Account actions</h2>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <LogOut size={18} />
              Sign out
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex w-full items-center gap-3 rounded-md border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={18} />

              {deleting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function AccountLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 p-5 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <div className="flex items-center gap-4">
        <div className="text-gray-600 dark:text-gray-300 ">{icon}</div>

        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <ArrowRight size={18} className="text-gray-400 dark:text-gray-500" />
    </Link>
  );
}
