"use client";

import { useState } from "react";
import type { Address } from "@/types/address";

type AddressFormProps = {
  initialAddress?: Address;
  onSuccess: (address: Address) => void;
  onCancel: () => void;
};

export default function AddressForm({
  initialAddress,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const isEditing = Boolean(initialAddress);

  const [label, setLabel] = useState(initialAddress?.label ?? "Home");

  const [fullName, setFullName] = useState(initialAddress?.fullName ?? "");

  const [phone, setPhone] = useState(initialAddress?.phone ?? "");

  const [address, setAddress] = useState(initialAddress?.address ?? "");

  const [city, setCity] = useState(initialAddress?.city ?? "");

  const [state, setState] = useState(initialAddress?.state ?? "");

  const [country, setCountry] = useState(initialAddress?.country ?? "Nigeria");

  const [isDefault, setIsDefault] = useState(
    initialAddress?.isDefault ?? false,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        label,
        fullName,
        phone,
        address,
        city,
        state,
        country,
        isDefault,
      };

      const url = isEditing
        ? `/api/addresses/${initialAddress?.id}`
        : "/api/addresses";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isEditing
              ? "Failed to update address"
              : "Failed to create address"),
        );
      }

      onSuccess(data.address);
    } catch (error) {
      console.error("Address form error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Address Label */}

      <div>
        <label
          htmlFor="address-label"
          className="mb-2 block text-sm font-medium"
        >
          Address Label
        </label>

        <select
          id="address-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={loading}
          className="w-full rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
        >
          <option value="Home">Home</option>
          <option value="Office">Office</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Full Name */}

      <div>
        <label htmlFor="full-name" className="mb-2 block text-sm font-medium">
          Full Name
        </label>

        <input
          id="full-name"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          disabled={loading}
          autoComplete="name"
          placeholder="Your full name"
          className="w-full rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
        />
      </div>

      {/* Phone */}

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          Phone Number
        </label>

        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          disabled={loading}
          autoComplete="tel"
          placeholder="08012345678"
          className="w-full rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
        />
      </div>

      {/* Street Address */}

      <div>
        <label
          htmlFor="street-address"
          className="mb-2 block text-sm font-medium"
        >
          Street Address
        </label>

        <textarea
          id="street-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
          disabled={loading}
          rows={3}
          autoComplete="street-address"
          placeholder="12 Example Street"
          className="w-full resize-none rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
        />
      </div>

      {/* City + State */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="mb-2 block text-sm font-medium">
            City
          </label>

          <input
            id="city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
            disabled={loading}
            autoComplete="address-level2"
            placeholder="Enugu"
            className="w-full rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
          />
        </div>

        <div>
          <label htmlFor="state" className="mb-2 block text-sm font-medium">
            State
          </label>

          <input
            id="state"
            type="text"
            value={state}
            onChange={(event) => setState(event.target.value)}
            required
            disabled={loading}
            autoComplete="address-level1"
            placeholder="Enugu State"
            className="w-full rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Country */}

      <div>
        <label htmlFor="country" className="mb-2 block text-sm font-medium">
          Country
        </label>

        <input
          id="country"
          type="text"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          required
          disabled={loading}
          autoComplete="country-name"
          placeholder="Nigeria"
          className="w-full rounded-md border border-gray-300 bg-white p-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-white dark:focus:ring-white"
        />
      </div>

      {/* Default Address */}

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
          disabled={loading}
          className="h-4 w-4 rounded border-gray-300"
        />

        <span className="text-sm text-gray-700 dark:text-gray-300">
          Make this my default address
        </span>
      </label>

      {/* Error */}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-md border border-gray-300 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white dark:border-black/30 dark:border-t-black" />
          )}

          {loading
            ? isEditing
              ? "Updating..."
              : "Saving..."
            : isEditing
              ? "Update Address"
              : "Save Address"}
        </button>
      </div>
    </form>
  );
}
