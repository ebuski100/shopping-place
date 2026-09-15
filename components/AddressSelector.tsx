"use client";

import { useEffect, useState } from "react";

import type { Address } from "@/types/address";

import AddressForm from "./AddressForm";
import Modal from "./Modal";

type AddressSelectorProps = {
  selectedAddress: Address | null;
  onSelect: (address: Address) => void;
};

export default function AddressSelector({
  selectedAddress,
  onSelect,
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddressModal, setShowAddressModal] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);

  const [pendingAddressId, setPendingAddressId] = useState<number | null>(null);

  useEffect(() => {
    async function loadAddresses() {
      try {
        const response = await fetch("/api/addresses");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch addresses");
        }

        const fetchedAddresses: Address[] = data.addresses;

        setAddresses(fetchedAddresses);

        // Automatically select the default address.
        if (!selectedAddress && fetchedAddresses.length > 0) {
          const defaultAddress =
            fetchedAddresses.find((address) => address.isDefault) ??
            fetchedAddresses[0];

          onSelect(defaultAddress);
        }
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error ? error.message : "Failed to load addresses",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAddresses();
  }, []);

  function handleNewAddress(address: Address) {
    setAddresses((current) => [address, ...current]);

    onSelect(address);

    setShowFormModal(false);
  }

  function handleAddressSelectionDone() {
    if (pendingAddressId !== null) {
      const address = addresses.find((item) => item.id === pendingAddressId);

      if (address) {
        onSelect(address);
      }
    }

    setShowAddressModal(false);
    setPendingAddressId(null);
  }

  if (loading) {
    return (
      <div className="rounded-lg border p-5">
        <p className="text-gray-500 dark:text-gray-400">Loading delivery information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-5">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Delivery information */}
      <div className="rounded-xl border p-5">
        {selectedAddress ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-semibold">{selectedAddress.label}</h3>

                  {selectedAddress.isDefault && (
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs">
                      Default
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedAddress.fullName}
                  </p>

                  <p>{selectedAddress.phone}</p>

                  <p>{selectedAddress.address}</p>

                  <p>
                    {selectedAddress.city}, {selectedAddress.state}
                  </p>

                  <p>{selectedAddress.country}</p>
                </div>
              </div>

              {addresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingAddressId(selectedAddress.id);

                    setShowAddressModal(true);
                  }}
                  className="text-sm font-medium underline"
                >
                  Change Address
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFormModal(true)}
              className="mt-5 text-sm font-medium"
            >
              + Add New Address
            </button>
          </>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-300">No delivery address selected.</p>

            <button
              type="button"
              onClick={() => setShowFormModal(true)}
              className="mt-4 rounded-md bg-black px-5 py-3 text-sm text-white"
            >
              + Add New Address
            </button>
          </div>
        )}
      </div>

      {/* Saved addresses modal */}
      <Modal
        open={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setPendingAddressId(null);
        }}
        title="Select Delivery Address"
      >
        <div className="space-y-3">
          {addresses.map((address) => {
            const selected = pendingAddressId === address.id;

            return (
              <button
                key={address.id}
                type="button"
                onClick={() => setPendingAddressId(address.id)}
                className={`w-full rounded-lg border p-4 text-left ${
                  selected
                    ? "border-black ring-2 ring-black"
                    : "hover:border-gray-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-5 w-5 shrink-0 rounded-full border ${
                      selected ? "border-black bg-black" : "border-gray-400"
                    }`}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{address.label}</p>

                      {address.isDefault && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Default</span>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>{address.fullName}</p>
                      <p>{address.phone}</p>
                      <p>{address.address}</p>
                      <p>
                        {address.city}, {address.state}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setShowAddressModal(false);
              setShowFormModal(true);
            }}
            className="rounded-md border px-4 py-2 text-sm"
          >
            + Add New Address
          </button>

          <button
            type="button"
            onClick={handleAddressSelectionDone}
            className="rounded-md bg-black px-6 py-2 text-sm text-white"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Add address modal */}
      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Add New Address"
      >
        <AddressForm
          onSuccess={handleNewAddress}
          onCancel={() => setShowFormModal(false)}
        />
      </Modal>
    </>
  );
}
