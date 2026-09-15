"use client";

import { useState } from "react";
import CheckoutForm from "@/components/CheckoutForm";
import { deliveryOptions } from "@/lib/delivery";
import type { Cart } from "@/types/cart";
import type { Address } from "@/types/address";
import type { CheckoutInput } from "@/lib/validations/checkout";
import { useStoreCounts } from "@/lib/store/useStoreCounts";
type CheckoutClientProps = {
  cart: Cart;
};

export default function CheckoutClient({ cart }: CheckoutClientProps) {
  const [deliveryMethod, setDeliveryMethod] =
    useState<CheckoutInput["deliveryMethod"]>("free");

  const { loadCartCount, loadOrderCount } = useStoreCounts();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const selectedDelivery = deliveryOptions.find(
    (option) => option.id === deliveryMethod,
  );

  const deliveryFee = selectedDelivery?.price ?? 0;

  const total = subtotal + deliveryFee;

  async function handleContinueToPayment() {
    setError("");

    // Make sure an address has been selected
    if (!selectedAddress) {
      setError("Please select or add a delivery address.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the order
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country,
          deliveryMethod,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        setError(orderData.error || "Failed to create order");
        return;
      }

      await loadCartCount();
      await loadOrderCount();

      const orderId = orderData.order.id;

      // 2. Initialize Paystack
      const paymentResponse = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        setError(paymentData.error || "Failed to initialize payment");
        return;
      }

      // 3. Redirect to Paystack
      window.location.href = paymentData.authorizationUrl;
    } catch (error) {
      console.error("Payment initialization error:", error);

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {/* LEFT SIDE */}
      <section className="space-y-6 md:col-span-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-6 text-xl font-semibold">Delivery Information</h2>

          <CheckoutForm
            selectedAddress={selectedAddress}
            onAddressChange={setSelectedAddress}
            deliveryMethod={deliveryMethod}
            onDeliveryMethodChange={setDeliveryMethod}
          />
        </div>
      </section>

      {/* RIGHT SIDE */}
      <aside className="h-fit rounded-lg border p-6">
        <h2 className="mb-6 text-xl font-semibold">Order Summary</h2>

        {/* PRODUCTS */}
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{item.product.name}</p>

                <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
              </div>

              <p className="shrink-0 font-medium">
                ₦{(item.product.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <div className="my-6 space-y-3 border-t pt-6">
          <div className="flex justify-between">
            <span>Subtotal</span>

            <span>₦{subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>{selectedDelivery?.name ?? "Delivery"}</span>

            <span>
              {deliveryFee === 0 ? "Free" : `₦${deliveryFee.toLocaleString()}`}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>

            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        {/* PAYMENT ERROR */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* CONTINUE TO PAYMENT */}
        <button
          type="button"
          onClick={handleContinueToPayment}
          disabled={loading || !selectedAddress}
          className="w-full rounded-md bg-black py-3 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Continue to Payment"}
        </button>

        {!selectedAddress && (
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Select a delivery address to continue.
          </p>
        )}
      </aside>
    </div>
  );
}
