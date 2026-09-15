// import "dotenv/config";
// import { PrismaClient } from "../lib/generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";

// const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//   throw new Error("DATABASE_URL is not defined");
// }

// const adapter = new PrismaPg({
//   connectionString,
// });

// const prisma = new PrismaClient({ adapter });

// const products = [
//   {
//     name: "iPhone 16",
//     description: "Latest Apple smartphone",
//     price: 1200000,
//     image: "/products/iphone-16.jpg",
//     category: "phones",
//     stock: 15,
//   },
//   {
//     name: "MacBook Air M3",
//     description: "Lightweight Apple laptop",
//     price: 1800000,
//     image: "/products/macbook-air.jpg",
//     category: "laptops",
//     stock: 10,
//   },
//   {
//     name: "AirPods Pro",
//     description: "Wireless noise-cancelling earbuds",
//     price: 350000,
//     image: "/products/airpods-pro.jpg",
//     category: "audio",
//     stock: 25,
//   },
// ];

// async function seed() {
//   try {
//     await prisma.product.deleteMany();

//     await prisma.product.createMany({
//       data: products,
//     });

//     console.log("Products seeded successfully");
//   } catch (error) {
//     console.error("Error seeding products:", error);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// seed();

import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

type DummyProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  thumbnail: string;
  images: string[];
};

type DummyProductsResponse = {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
};

// --------------------------------------------------
// Fetch products from DummyJSON
// --------------------------------------------------

async function fetchProducts(): Promise<DummyProduct[]> {
  const response = await fetch("https://dummyjson.com/products?limit=0");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products: ${response.status} ${response.statusText}`,
    );
  }

  const data: DummyProductsResponse = await response.json();

  return data.products;
}

// --------------------------------------------------
// Convert USD-style fake price into NGN
// --------------------------------------------------

function convertToNaira(price: number): number {
  // Development exchange rate.
  // This is NOT a real-time exchange rate.
  const exchangeRate = 1500;

  return Math.round(price * exchangeRate);
}

// --------------------------------------------------
// Main seed function
// --------------------------------------------------

async function seed() {
  try {
    console.log("Fetching products from DummyJSON...");

    const dummyProducts = await fetchProducts();

    console.log(`Fetched ${dummyProducts.length} products successfully.`);

    // --------------------------------------------------
    // Clear existing products
    // --------------------------------------------------

    console.log("Removing existing products...");

    // --------------------------------------------------
    // Transform products
    // --------------------------------------------------

    const products = dummyProducts.map((product) => ({
      name: product.title,

      description: product.description,

      price: convertToNaira(product.price),

      // Use the external image URL directly for development.
      image: product.thumbnail,

      category: product.category,

      // Keep some variety in stock.
      stock: product.stock,

      isActive: true,
    }));

    // --------------------------------------------------
    // Insert products
    // --------------------------------------------------

    console.log("Creating products in PostgreSQL...");

    await prisma.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    console.log(`Successfully seeded ${products.length} products.`);
  } catch (error) {
    console.error("Error seeding products:", error);

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
