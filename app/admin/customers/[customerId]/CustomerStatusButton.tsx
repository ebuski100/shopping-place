"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CustomerStatusButtonProps = {
  customerId: number;
  isActive: boolean;
};

export default function CustomerStatusButton({
  customerId,
  isActive,
}: CustomerStatusButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange() {
    const nextStatus = !isActive;

    const confirmed = window.confirm(
      nextStatus
        ? "Are you sure you want to activate this customer?"
        : "Are you sure you want to deactivate this customer?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: nextStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update customer status");
      }

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleStatusChange}
        disabled={loading}
        className={`rounded-md px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading
          ? "Updating..."
          : isActive
            ? "Deactivate Customer"
            : "Activate Customer"}
      </button>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
