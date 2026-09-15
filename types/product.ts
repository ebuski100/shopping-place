import type { Product as PrismaProduct } from "@/lib/generated/prisma/client";

export type Product = PrismaProduct;

export type ProductDTO = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartProduct = Pick<
  ProductDTO,
  "id" | "name" | "price" | "image" | "stock"
>;
