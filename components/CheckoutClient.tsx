"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Package,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";

import CheckoutForm from "@/components/CheckoutForm";
import { deliveryOptions } from "@/lib/delivery";

import type { Cart } from "@/types/cart";
import type { Address } from "@/types/address";
import type { CheckoutInput } from "@/lib/validations/checkout";

import { useStoreCounts } from "@/lib/store/useStoreCounts";
import Image from "next/image";
import GoBack from "./GoBack";

type CheckoutClientProps = {
  cart: Cart;
};

export default function CheckoutClient({ cart }: CheckoutClientProps) {
  const [deliveryMethod, setDeliveryMethod] =
    useState<CheckoutInput["deliveryMethod"]>("free");

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const { loadCartCount, loadOrderCount } = useStoreCounts();

  // ------------------------------------------
  // ORDER TOTALS
  // ------------------------------------------

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const selectedDelivery = deliveryOptions.find(
    (option) => option.id === deliveryMethod,
  );

  const deliveryFee = selectedDelivery?.price ?? 0;

  const total = subtotal + deliveryFee;

  // ------------------------------------------
  // CONTINUE TO PAYMENT
  // ------------------------------------------

  async function handleContinueToPayment() {
    setError("");

    // Make sure an address has been selected.
    if (!selectedAddress) {
      setError("Please select or add a delivery address.");

      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------
      // 1. CREATE ORDER
      // ------------------------------------------

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

      // ------------------------------------------
      // 2. INITIALIZE PAYSTACK
      // ------------------------------------------

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

      // ------------------------------------------
      // 3. REDIRECT TO PAYSTACK
      // ------------------------------------------

      window.location.href = paymentData.authorizationUrl;
    } catch (error) {
      console.error("Payment initialization error:", error);

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950">
      <div className=" w-full max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* ------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------ */}

        <div className="mb-8">
          <div className="flex flex-col justify-center gap-3">
            <div className="flex">
              <div className=" mr-2 -ml-2">
                <GoBack />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl mr-2">
                Checkout
              </h1>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                <Package size={21} strokeWidth={2} />
              </div>
            </div>
            <p className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              Complete your order securely.
            </p>
          </div>

          {/* Progress */}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                1
              </div>

              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Delivery
              </span>
            </div>

            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />

            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-xs font-medium dark:border-gray-700">
                2
              </div>

              <span className="hidden text-sm sm:inline">Payment</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------ */}
        {/* MAIN CHECKOUT GRID */}
        {/* ------------------------------------------ */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          {/* ======================================== */}
          {/* LEFT SIDE */}
          {/* ======================================== */}

          <section className="space-y-6 ">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {/* Section header */}

              <div className="border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <Package size={18} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delivery Information
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout form */}

              <div className="p-5 sm:p-6">
                <CheckoutForm
                  selectedAddress={selectedAddress}
                  onAddressChange={setSelectedAddress}
                  deliveryMethod={deliveryMethod}
                  onDeliveryMethodChange={setDeliveryMethod}
                />
              </div>
            </div>

            {/* ------------------------------------------ */}
            {/* SECURITY / REASSURANCE */}
            {/* ------------------------------------------ */}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                    <ShieldCheck size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Secure checkout
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      Protected payment
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <CreditCard size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Secure payment
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      Powered by Paystack
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <LockKeyhole size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Your data is safe
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      Private & protected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================== */}
          {/* RIGHT SIDE - ORDER SUMMARY */}
          {/* ======================================== */}

          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {/* Header */}

              <div className="border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order Summary
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {cart.items.length}{" "}
                      {cart.items.length === 1 ? "item" : "items"} in your cart
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <ShoppingCart size={19} />
                  </div>
                </div>
              </div>

              {/* Products */}

              <div className="max-h-[320px] overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {/* Product image */}

                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      {/* Product information */}

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                          {item.product.name}
                        </p>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity}
                          </p>

                          <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
                            ₦
                            {(
                              item.product.price * item.quantity
                            ).toLocaleString("en-NG")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}

              <div className="border-t border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Subtotal
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      ₦{subtotal.toLocaleString("en-NG")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {selectedDelivery?.name ?? "Delivery"}
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      {deliveryFee === 0
                        ? "Free"
                        : `₦${deliveryFee.toLocaleString("en-NG")}`}
                    </span>
                  </div>
                </div>

                <div className="my-5 h-px bg-gray-200 dark:bg-gray-800" />

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      ₦{total.toLocaleString("en-NG")}
                    </p>
                  </div>

                  {selectedAddress && (
                    <div className="flex items-center gap-1.5 pb-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 size={15} />
                      Address selected
                    </div>
                  )}
                </div>

                {/* Error */}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                    <p className="text-sm leading-5 text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* CTA */}

                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  disabled={loading || !selectedAddress}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white dark:border-black/30 dark:border-t-black" />

                      <span>Processing payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />

                      <span>Continue to Payment</span>
                    </>
                  )}
                </button>

                {!selectedAddress && (
                  <p className="mt-3 text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Select or add a delivery address to continue.
                  </p>
                )}

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  <LockKeyhole size={12} />
                  Secure payment powered by Paystack
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
