"use client";

import { useState } from "react";

type PayOrderButtonProps = {
  orderId: number;
};

export default function PayOrderButton({ orderId }: PayOrderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (!data.authorizationUrl) {
        throw new Error("Payment authorization URL was not returned");
      }

      window.location.href = data.authorizationUrl;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to initialize payment",
      );

      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="w-full rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Redirecting to payment..." : "Pay Now"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
