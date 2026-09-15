import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),

  description: z.string().trim().min(1, "Product description is required"),

  category: z.string().trim().min(1, "Product category is required"),

  image: z.string().trim().min(1, "Product image is required"),

  cloudinaryPublicId: z
    .string()
    .trim()
    .min(1, "Cloudinary public ID cannot be empty")
    .optional(),

  price: z.coerce
    .number()
    .finite("Invalid product price")
    .min(0, "Product price cannot be negative"),

  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
});

export const productIdSchema = z.coerce
  .number()
  .int("Product ID must be an integer")
  .positive("Product ID must be a positive integer");

export const productUpdateSchema = productSchema.partial();

export type ProductId = z.infer<typeof productIdSchema>;

export type ProductInput = z.infer<typeof productSchema>;

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
