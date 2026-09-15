"use client";

import { useState } from "react";
import type { Address } from "@/types/address";

type AddressFormProps = {
  onSuccess: (address: Address) => void;
  onCancel: () => void;
};

export default function AddressForm({ onSuccess, onCancel }: AddressFormProps) {
  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [isDefault, setIsDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          fullName,
          phone,
          address,
          city,
          state,
          country,
          isDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create address");
        return;
      }

      onSuccess(data.address);
    } catch (error) {
      console.error(error);

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full rounded-md border p-3"
        >
          <option value="Home">Home</option>
          <option value="Office">Office</option>
          <option value="Other">Other</option>
        </select>
      </div>

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
          className="w-full rounded-md border p-3"
          placeholder="your full name ..."
        />
      </div>

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
          className="w-full rounded-md border p-3"
          placeholder="08012345678"
        />
      </div>

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
          rows={3}
          className="w-full rounded-md border p-3"
          placeholder="12 Example Street"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            className="w-full rounded-md border p-3"
            placeholder="Enugu"
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
            className="w-full rounded-md border p-3"
            placeholder="Enugu State"
          />
        </div>
      </div>

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
          className="w-full rounded-md border p-3"
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
          className="h-4 w-4"
        />

        <span className="text-sm">Make this my default address</span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-md border py-3"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-black py-3 text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Address"}
        </button>
      </div>
    </form>
  );
}
