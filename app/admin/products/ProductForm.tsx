"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFormProps = {
  product?: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
  };
};

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();

  const editing = Boolean(product); //

  const [name, setName] = useState(product?.name ?? "");

  const [description, setDescription] = useState(product?.description ?? "");

  const [price, setPrice] = useState(product?.price.toString() ?? "");

  const [image, setImage] = useState(product?.image ?? "");

  const [category, setCategory] = useState(product?.category ?? "");

  const [stock, setStock] = useState(product?.stock.toString() ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";

      const method = product ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          image,
          category,
          stock,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-lg border bg-white dark:bg-gray-900 p-6"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">Product name</label>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          placeholder="iPhone 17 Pro"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Description</label>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={5}
          className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          placeholder="Product description..."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Price (₦)</label>

          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Stock</label>

          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            required
            className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Category</label>

        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
          className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          placeholder="Electronics"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Image URL</label>

        <input
          type="url"
          value={image}
          onChange={(event) => setImage(event.target.value)}
          required
          className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          placeholder="https://example.com/product.jpg"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
      </button>
    </form>
  );
}
