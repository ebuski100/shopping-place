"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(
    null,
  );

  const [deleteError, setDeleteError] = useState("");

  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --------------------------------------------------
  // LOAD ADDRESSES
  // --------------------------------------------------

  useEffect(() => {
    async function loadAddresses() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/addresses", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch addresses");
        }

        const fetchedAddresses: Address[] = data.addresses ?? [];

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

  // --------------------------------------------------
  // ADD ADDRESS
  // --------------------------------------------------

  function handleNewAddress(address: Address) {
    setAddresses((current) => [address, ...current]);

    onSelect(address);

    setShowFormModal(false);
    setEditingAddress(null);
  }

  // --------------------------------------------------
  // EDIT ADDRESS SUCCESS
  // --------------------------------------------------

  function handleEditedAddress(updatedAddress: Address) {
    setAddresses((current) =>
      current.map((address) =>
        address.id === updatedAddress.id
          ? updatedAddress
          : updatedAddress.isDefault
            ? {
                ...address,
                isDefault: false,
              }
            : address,
      ),
    );

    // If this is the currently selected address,
    // update the selected address too.
    if (selectedAddress?.id === updatedAddress.id) {
      onSelect(updatedAddress);
    }

    setEditingAddress(null);
    setShowFormModal(false);
  }

  // --------------------------------------------------
  // SELECT ADDRESS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // EDIT ADDRESS
  // --------------------------------------------------

  function handleEditAddress(address: Address) {
    setEditingAddress(address);
    setShowAddressModal(false);
    setShowFormModal(true);
  }

  // --------------------------------------------------
  // DELETE ADDRESS
  // --------------------------------------------------

  // async function handleDeleteAddress(address: Address) {
  //   if (deletingAddressId !== null) {
  //     return;
  //   }

  //   const confirmed = window.confirm(`Delete "${address.label}" address?`);

  //   if (!confirmed) {
  //     return;
  //   }

  //   setDeletingAddressId(address.id);
  //   setDeleteError("");

  //   try {
  //     const response = await fetch(`/api/addresses/${address.id}`, {
  //       method: "DELETE",
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || "Failed to delete address");
  //     }

  //     const remainingAddresses = addresses.filter(
  //       (item) => item.id !== address.id,
  //     );

  //     setAddresses(remainingAddresses);

  //     // If the deleted address was selected,
  //     // select another address automatically.
  //     if (selectedAddress?.id === address.id) {
  //       const nextAddress =
  //         remainingAddresses.find((item) => item.isDefault) ??
  //         remainingAddresses[0];

  //       onSelect(nextAddress ?? null);
  //     }

  //     // If the deleted address was the pending
  //     // address in the selection modal.
  //     if (pendingAddressId === address.id) {
  //       setPendingAddressId(null);
  //     }
  //   } catch (error) {
  //     console.error(error);

  //     setDeleteError(
  //       error instanceof Error ? error.message : "Failed to delete address",
  //     );
  //   } finally {
  //     setDeletingAddressId(null);
  //   }
  // }

  async function handleDeleteAddress(address: Address) {
    if (deletingAddressId !== null) {
      return;
    }

    setAddressToDelete(address);
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function confirmDeleteAddress() {
    if (!addressToDelete || deletingAddressId !== null) {
      return;
    }

    const addressId = addressToDelete.id;

    setDeletingAddressId(addressId);
    setDeleteError("");

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete address");
      }

      const remainingAddresses = addresses.filter(
        (item) => item.id !== addressId,
      );

      setAddresses(remainingAddresses);

      // If the deleted address was selected,
      // automatically select another address.
      if (selectedAddress?.id === addressId) {
        const nextAddress =
          remainingAddresses.find((item) => item.isDefault) ??
          remainingAddresses[0];

        onSelect(nextAddress ?? null);
      }

      // If the deleted address was the pending
      // address in the selection modal.
      if (pendingAddressId === addressId) {
        setPendingAddressId(null);
      }

      // Close confirmation modal.
      setShowDeleteModal(false);
      setAddressToDelete(null);
    } catch (error) {
      console.error(error);

      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete address",
      );
    } finally {
      setDeletingAddressId(null);
    }
  }
  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white" />
          Loading delivery information...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* ================================================= */}
      {/* SELECTED ADDRESS */}
      {/* ================================================= */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {selectedAddress ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedAddress.label}
                  </h3>

                  {selectedAddress.isDefault && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
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
                  className="shrink-0 cursor-pointer text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black dark:text-gray-300 dark:hover:text-white"
                >
                  Change
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingAddress(null);
                setShowFormModal(true);
              }}
              className="mt-5 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              <Plus size={16} />
              Add New Address
            </button>
          </>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No delivery address selected.
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingAddress(null);
                setShowFormModal(true);
              }}
              className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <Plus size={17} />
              Add New Address
            </button>
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* SAVED ADDRESSES MODAL */}
      {/* ================================================= */}

      <Modal
        open={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setPendingAddressId(null);
          setDeleteError("");
        }}
        title="Select Delivery Address"
      >
        <div className="space-y-3">
          {addresses.map((address) => {
            const selected = pendingAddressId === address.id;

            const deleting = deletingAddressId === address.id;

            return (
              <div
                key={address.id}
                className={`rounded-xl border p-4 transition ${
                  selected
                    ? "border-black ring-1 ring-black dark:border-white dark:ring-white"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                {/* Address selection */}
                <button
                  type="button"
                  onClick={() => setPendingAddressId(address.id)}
                  className="w-full cursor-pointer text-left"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-black bg-black dark:border-white dark:bg-white"
                          : "border-gray-400"
                      }`}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-white dark:bg-black" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {address.label}
                        </p>

                        {address.isDefault && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
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

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => handleEditAddress(address)}
                    disabled={deleting}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(address)}
                    disabled={deleting}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {deleting ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {deleteError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {deleteError}
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <button
            type="button"
            onClick={() => {
              setShowAddressModal(false);
              setEditingAddress(null);
              setShowFormModal(true);
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <Plus size={16} />
            Add New Address
          </button>

          <button
            type="button"
            onClick={handleAddressSelectionDone}
            className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* ================================================= */}
      {/* DELETE ADDRESS CONFIRMATION MODAL */}
      {/* ================================================= */}

      <Modal
        open={showDeleteModal}
        onClose={() => {
          if (deletingAddressId !== null) {
            return;
          }

          setShowDeleteModal(false);
          setAddressToDelete(null);
          setDeleteError("");
        }}
        title="Delete Address"
      >
        <div className="space-y-5">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 size={22} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Delete this address?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Are you sure you want to delete your{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {addressToDelete?.label}
              </span>{" "}
              address? This action cannot be undone.
            </p>
          </div>

          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {deleteError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setAddressToDelete(null);
                setDeleteError("");
              }}
              disabled={deletingAddressId !== null}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDeleteAddress}
              disabled={deletingAddressId !== null}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingAddressId !== null ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Address
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================= */}
      {/* ADD / EDIT ADDRESS MODAL */}
      {/* ================================================= */}

      <Modal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingAddress(null);
        }}
        title={editingAddress ? "Edit Delivery Address" : "Add New Address"}
      >
        <AddressForm
          initialAddress={editingAddress ?? undefined}
          onSuccess={editingAddress ? handleEditedAddress : handleNewAddress}
          onCancel={() => {
            setShowFormModal(false);
            setEditingAddress(null);
          }}
        />
      </Modal>
    </>
  );
}
