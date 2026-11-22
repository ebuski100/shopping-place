import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg(connectionString as string, {
    onPoolError: (err) => {
      console.error("Prisma pool error:", err);
    },
    onConnectionError: (err) => {
      console.error("Prisma connection error:", err);
    },
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the same client across hot reloads in dev AND across serverless
// invocations in production to avoid exhausting the database connection pool.
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}