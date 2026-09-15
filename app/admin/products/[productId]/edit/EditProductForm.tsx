"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  cloudinaryPublicId: string | null;
};

type EditProductFormProps = {
  product: Product;
};

type UploadResponse = {
  message?: string;
  url?: string;
  publicId?: string;
  error?: string;
};

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState(product.category);
  const [image, setImage] = useState(product.image);
  const [stock, setStock] = useState(String(product.stock));
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(
    product.cloudinaryPublicId ?? "",
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState(product.image);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.");

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
  }

  async function uploadImage() {
    if (!selectedFile) {
      return {
        url: image,
        publicId: cloudinaryPublicId,
      };
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });

      let data: UploadResponse;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from image upload.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      if (!data.url || !data.publicId) {
        throw new Error(
          "Image upload succeeded but no image information was returned.",
        );
      }

      return {
        url: data.url,
        publicId: data.publicId,
      };
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      let updatedImage = image;
      let updatedPublicId = cloudinaryPublicId;

      /*
       * If the admin selected a new image,
       * upload it to Cloudinary first.
       */
      if (selectedFile) {
        const uploaded = await uploadImage();

        updatedImage = uploaded.url;
        updatedPublicId = uploaded.publicId;
      }

      /*
       * Update the product using the new
       * Cloudinary information.
       */
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          category,
          image: updatedImage,
          stock,
          cloudinaryPublicId: updatedPublicId || undefined,
        }),
      });

      let data: {
        error?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from server.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const isBusy = loading || uploading;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border bg-white dark:bg-gray-900 p-8"
    >
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Product Name
        </label>

        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border px-4 py-3 outline-none focus:border-black"
          required
        />
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="mb-2 block text-sm font-medium">
          Price
        </label>

        <input
          id="price"
          type="number"
          min="0"
          step="1"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="w-full rounded-md border px-4 py-3 outline-none focus:border-black"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="mb-2 block text-sm font-medium">
          Category
        </label>

        <input
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-md border px-4 py-3 outline-none focus:border-black"
          required
        />
      </div>

      {/* Image */}
      <div>
        <label htmlFor="image" className="mb-2 block text-sm font-medium">
          Product Image
        </label>

        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isBusy}
          className="w-full cursor-pointer rounded-md border px-4 py-3 text-sm"
        />

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Select a new image only if you want to replace the current one. JPEG,
          PNG, or WebP, maximum 5MB.
        </p>

        {/* Image Preview */}
        {previewUrl && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Image Preview</p>

            <div className="relative h-48 w-48 overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-950">
              <Image
                src={previewUrl}
                alt={name}
                fill
                sizes="192px"
                className="object-contain"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            </div>
          </div>
        )}

        {selectedFile && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            New image: {selectedFile.name}
          </p>
        )}

        {uploading && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Uploading new image...</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          className="w-full resize-none rounded-md border px-4 py-3 outline-none focus:border-black"
          required
        />
      </div>

      {/* Stock */}
      <div>
        <label htmlFor="stock" className="mb-2 block text-sm font-medium">
          Stock
        </label>

        <input
          id="stock"
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          className="w-full rounded-md border px-4 py-3 outline-none focus:border-black"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 border-t pt-6">
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-md bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading image..."
            : loading
              ? "Saving..."
              : "Save Changes"}
        </button>

        <Link
          href="/admin/products"
          className={`rounded-md border px-6 py-3 font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
            isBusy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
