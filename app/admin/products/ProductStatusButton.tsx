"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductStatusButtonProps = {
  productId: number;
  isActive: boolean;
};

export default function ProductStatusButton({
  productId,
  isActive,
}: ProductStatusButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    const action = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this product?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/products/${productId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error ? error.message : "Failed to update product",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleStatus}
      disabled={loading}
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? "border border-red-200 text-red-600 hover:bg-red-50"
          : "border border-green-200 text-green-600 hover:bg-green-50"
      }`}
    >
      {loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
