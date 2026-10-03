"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Camera,
  Heart,
  ImageIcon,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import GoBack from "@/components/GoBack";

type AccountUser = {
  id: number;
  name: string | null;
  email: string;
  profileImage?: string | null;
  role: "CUSTOMER" | "ADMIN";
};

type AccountClientProps = {
  user: AccountUser;
};

export default function AccountClient({ user }: AccountClientProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [profileImage, setProfileImage] = useState(user.profileImage ?? "");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveImageModal, setShowRemoveImageModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Camera state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [error]);

  // Clean up camera when the component unmounts.
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [cameraStream]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update account");
      }

      setMessage("Account updated successfully.");
      setEditing(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileImage(file: File) {
    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/account/profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload profile picture");
      }

      setProfileImage(data.profileImage);
      setMessage("Profile picture updated.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    await uploadProfileImage(file);

    event.target.value = "";
  }

  /*
   * --------------------------------------------------------------------------
   * Image picker
   * --------------------------------------------------------------------------
   */

  function openImagePicker() {
    setMessage("");
    setError("");
    setShowImagePickerModal(true);
  }

  function closeImagePicker() {
    setShowImagePickerModal(false);
  }

  function handleChooseFromDevice() {
    setShowImagePickerModal(false);

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  }

  /*
   * --------------------------------------------------------------------------
   * Camera
   * --------------------------------------------------------------------------
   */

  async function startCamera() {
    setCameraError("");
    setCameraLoading(true);
    setCapturedImage(null);
    setCapturedBlob(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 1280,
          },
        },
        audio: false,
      });

      setCameraStream(stream);
      setShowCameraModal(true);

      // Wait for the modal/video element to render.
      setTimeout(() => {
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        videoRef.current.play().catch((playError) => {
          console.error("Camera preview could not start:", playError);
        });
      }, 50);
    } catch (cameraError) {
      console.error("Camera error:", cameraError);

      if (
        cameraError instanceof DOMException &&
        cameraError.name === "NotAllowedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser and try again.",
        );
      } else if (
        cameraError instanceof DOMException &&
        cameraError.name === "NotFoundError"
      ) {
        setCameraError("No camera was found on this device.");
      } else if (
        cameraError instanceof DOMException &&
        cameraError.name === "NotReadableError"
      ) {
        setCameraError(
          "The camera is already being used by another application.",
        );
      } else {
        setCameraError(
          cameraError instanceof Error
            ? cameraError.message
            : "Unable to access the camera.",
        );
      }
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setCameraStream(null);
  }

  function handleTakePhoto() {
    setShowImagePickerModal(false);

    setTimeout(() => {
      startCamera();
    }, 100);
  }

  function handleCapturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setCameraError("Unable to capture the photo.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is not ready yet. Please wait a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to process the photo.");
      return;
    }

    /*
     * Mirror the captured image so the final picture
     * looks like the camera preview.
     */
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    context.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to create the photo.");
          return;
        }

        const imageUrl = URL.createObjectURL(blob);

        setCapturedBlob(blob);
        setCapturedImage(imageUrl);

        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  async function handleRetakePhoto() {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }

    setCapturedImage(null);
    setCapturedBlob(null);
    setCameraError("");

    await startCamera();
  }

  async function handleUseCapturedPhoto() {
    if (!capturedBlob) {
      setCameraError("No photo has been captured.");
      return;
    }

    const file = new File([capturedBlob], "profile-picture.jpg", {
      type: "image/jpeg",
    });

    await uploadProfileImage(file);

    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }

    setCapturedImage(null);
    setCapturedBlob(null);
    stopCamera();
    setShowCameraModal(false);
  }

  function closeCameraModal() {
    stopCamera();

    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }

    setCapturedImage(null);
    setCapturedBlob(null);
    setCameraError("");
    setCameraLoading(false);
    setShowCameraModal(false);
  }

  /*
   * --------------------------------------------------------------------------
   * Remove profile image
   * --------------------------------------------------------------------------
   */

  async function handleRemoveProfileImage() {
    setRemovingImage(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/profile-image", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove profile picture");
      }

      setProfileImage("");
      setMessage("Profile picture removed.");
      setShowRemoveImageModal(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setRemovingImage(false);
    }
  }

  /*
   * --------------------------------------------------------------------------
   * Logout
   * --------------------------------------------------------------------------
   */

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to log out.");
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to log out.");

      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  }

  /*
   * --------------------------------------------------------------------------
   * Delete account
   * --------------------------------------------------------------------------
   */

  async function handleDeleteAccount() {
    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");

      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  const initial =
    user.name?.trim().charAt(0).toUpperCase() ||
    user.email.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 pb-32">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex">
          <div className="mr-3">
            <GoBack />
          </div>

          <div>
            <h1 className="text-3xl font-bold">My Account</h1>

            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your profile and account settings.
            </p>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                : "border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="rounded-xl border border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative">
              <div className="relative h-28 w-28">
                {profileImage ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-full">
                    <Image
                      src={profileImage}
                      alt="Profile"
                      fill
                      sizes="112px"
                      className={`object-cover transition-opacity duration-200 ${
                        uploading ? "opacity-60" : "opacity-100"
                      }`}
                    />

                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[1px]">
                        <div
                          className="h-8 w-8 animate-spin rounded-full border-3 border-white/40 border-t-white"
                          aria-label="Uploading profile picture"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`flex h-28 w-28 items-center justify-center rounded-full bg-gray-200 text-3xl font-bold text-gray-600 transition-opacity duration-200 dark:bg-gray-700 dark:text-gray-300 ${
                      uploading ? "opacity-60" : "opacity-100"
                    }`}
                  >
                    {initial}

                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[1px]">
                        <div
                          className="h-8 w-8 animate-spin rounded-full border-3 border-white/40 border-t-white"
                          aria-label="Uploading profile picture"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={openImagePicker}
                disabled={uploading}
                className={`absolute bottom-0 right-0 rounded-full px-3 py-2 text-xs font-medium text-white transition ${
                  uploading
                    ? "cursor-not-allowed bg-gray-500"
                    : "cursor-pointer bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                }`}
              >
                {uploading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading...
                  </span>
                ) : (
                  "Edit"
                )}
              </button>

              <input
                ref={fileInputRef}
                id="profile-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">
                {user.name || "Welcome"}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>

              <p className="mt-2 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {user.role}
              </p>
            </div>
          </div>

          {profileImage && (
            <div className="mt-5 flex justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => setShowRemoveImageModal(true)}
                disabled={uploading || removingImage}
                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove profile picture
              </button>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Personal information</h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update your basic account information.
              </p>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-gray-500 dark:border-gray-700 cursor-pointer px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!editing || saving}
                className="
                  w-full rounded-md border border-gray-600 px-4 py-3 outline-none
                  focus:ring-1 focus:ring-black
                  disabled:cursor-not-allowed
                  disabled:bg-gray-200/20
                  disabled:text-gray-400
                  disabled:border-gray-700
                  dark:bg-gray-950
                  dark:disabled:bg-gray-900/40
                  dark:disabled:text-gray-500
                "
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-md border bg-gray-50 dark:bg-gray-950 px-4 py-3 text-gray-500 dark:text-gray-400"
              />

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email changes will require verification.
              </p>
            </div>

            {editing && (
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setName(user.name ?? "");
                    setEditing(false);
                  }}
                  disabled={saving}
                  className="rounded-md border px-5 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <AccountLink
            href="/orders"
            icon={<ShoppingBag size={20} />}
            title="My Orders"
            description="View your orders and delivery status."
          />

          <AccountLink
            href="/wishlist"
            icon={<Heart size={20} />}
            title="Wishlist"
            description="View products you've saved."
          />

          <AccountLink
            href="/cart"
            icon={<ShoppingCart size={20} />}
            title="Shopping Cart"
            description="View items currently in your cart."
          />
        </section>

        <section className="mt-6 rounded-xl border border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Account actions</h2>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              disabled={loggingOut || deleting}
              className="flex w-full items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={18} />
              Sign out
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting || loggingOut}
              className="flex w-full items-center gap-3 rounded-md border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={18} />

              {deleting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Image picker modal                                                  */}
      {/* ------------------------------------------------------------------ */}

      {showImagePickerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-picker-title"
          onClick={closeImagePicker}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="image-picker-title" className="text-lg font-semibold">
                  Change profile picture
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose how you want to add your picture.
                </p>
              </div>

              <button
                type="button"
                onClick={closeImagePicker}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleTakePhoto}
                className="flex w-full items-center gap-4 rounded-md border border-gray-300 p-4 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <Camera size={20} />
                </div>

                <div>
                  <p className="text-sm font-medium">Take photo</p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Use your device camera
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleChooseFromDevice}
                className="flex w-full items-center gap-4 rounded-md border border-gray-300 p-4 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <ImageIcon size={20} />
                </div>

                <div>
                  <p className="text-sm font-medium">Choose from device</p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select an existing picture
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={closeImagePicker}
              className="mt-5 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Real camera modal                                                   */}
      {/* ------------------------------------------------------------------ */}

      {showCameraModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-4 backdrop-blur-sm sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-title"
        >
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-700 bg-white shadow-2xl dark:bg-gray-900 sm:max-h-[calc(100vh-3rem)]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div>
                <h2 id="camera-title" className="text-lg font-semibold">
                  Take profile picture
                </h2>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Position yourself inside the camera view.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close camera"
              >
                <X size={20} />
              </button>
            </div>

            {/* Camera area */}
            <div className="min-h-0 flex-1 overflow-hidden bg-black p-4">
              {capturedImage ? (
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-black">
                  <img
                    src={capturedImage}
                    alt="Captured profile picture"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-contain"
                    style={{
                      transform: "scaleX(-1)",
                    }}
                  />

                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="text-center text-white">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-white/30 border-t-white" />

                        <p className="text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-6">
                      <div className="max-w-sm text-center text-white">
                        <Camera
                          size={34}
                          className="mx-auto mb-4 text-white/70"
                        />

                        <p className="text-sm leading-6">{cameraError}</p>

                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-5 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-3 border-t border-gray-200 p-5 dark:border-gray-700">
              {capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    disabled={uploading}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Retake
                  </button>

                  <button
                    type="button"
                    onClick={handleUseCapturedPhoto}
                    disabled={uploading}
                    className="flex-1 rounded-md bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    {uploading ? "Uploading..." : "Use photo"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    disabled={cameraLoading}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={cameraLoading || !!cameraError || !cameraStream}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    <Camera size={18} />
                    Take photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Remove profile picture confirmation                                 */}
      {/* ------------------------------------------------------------------ */}

      {showRemoveImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-image-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <Trash2 size={21} />
              </div>

              <div>
                <h2 id="remove-image-title" className="text-lg font-semibold">
                  Remove profile picture?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Your profile picture will be removed and your initials will be
                  shown instead.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveImageModal(false)}
                disabled={removingImage}
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemoveProfileImage}
                disabled={removingImage}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removingImage ? "Removing..." : "Remove picture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Logout confirmation                                                 */}
      {/* ------------------------------------------------------------------ */}

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <LogOut size={21} />
              </div>

              <div>
                <h2 id="logout-title" className="text-lg font-semibold">
                  Sign out?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Are you sure you want to sign out of your account?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Delete account confirmation                                         */}
      {/* ------------------------------------------------------------------ */}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <Trash2 size={21} />
              </div>

              <div>
                <h2 id="delete-account-title" className="text-lg font-semibold">
                  Delete your account?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  This action is permanent and cannot be undone. Your account
                  and associated data will be deleted.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AccountLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 p-5 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <div className="flex items-center gap-4">
        <div className="text-gray-600 dark:text-gray-300">{icon}</div>

        <div>
          <p className="font-medium">{title}</p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <ArrowRight size={18} className="text-gray-400 dark:text-gray-500" />
    </Link>
  );
}
