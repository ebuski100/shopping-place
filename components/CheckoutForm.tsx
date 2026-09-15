"use client";

import type { CheckoutInput } from "@/lib/validations/checkout";
import { deliveryOptions } from "@/lib/delivery";
import AddressSelector from "@/components/AddressSelector";
import type { Address } from "@/types/address";

type CheckoutFormProps = {
  selectedAddress: Address | null;

  onAddressChange: (address: Address | null) => void;

  deliveryMethod: CheckoutInput["deliveryMethod"];

  onDeliveryMethodChange: (method: CheckoutInput["deliveryMethod"]) => void;
};

export default function CheckoutForm({
  selectedAddress,
  onAddressChange,
  deliveryMethod,
  onDeliveryMethodChange,
}: CheckoutFormProps) {
  return (
    <div className="space-y-8">
      {/* DELIVERY INFORMATION */}
      <section>
        <AddressSelector
          selectedAddress={selectedAddress}
          onSelect={onAddressChange}
        />
      </section>

      {/* DELIVERY METHOD */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Delivery Method</h2>

        <div className="space-y-3">
          {deliveryOptions.map((option) => {
            const isSelected = deliveryMethod === option.id;

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  isSelected ? "border-black bg-gray-50 dark:bg-gray-950" : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={option.id}
                  checked={isSelected}
                  onChange={() =>
                    onDeliveryMethodChange(
                      option.id as CheckoutInput["deliveryMethod"],
                    )
                  }
                  className="mt-1"
                />

                <div className="flex-1">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium">{option.name}</span>

                    <span className="font-semibold">
                      {option.price === 0
                        ? "Free"
                        : `₦${option.price.toLocaleString()}`}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
