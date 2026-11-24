import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// Keep a single PrismaClient per warm serverless instance.
// Node.js module caching ensures this evaluates once per container start.
// The pg.Pool is created lazily so module evaluation succeeds even when
// DATABASE_URL is not yet available (e.g., during build-time page collection).
let pool: Pool | undefined;
let adapter: import("@prisma/adapter-pg").PrismaPg | undefined;
let prismaClient: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      // Each warm Vercel instance gets its own pool; keep its footprint small
      // when many instances share Supabase's transaction pooler.
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      allowExitOnIdle: true,
    });
  }

  if (!adapter) {
    adapter = new PrismaPg(pool, {
      onPoolError: (err) => {
        console.error("Prisma pool error:", err);
      },
      onConnectionError: (err) => {
        console.error("Prisma connection error:", err);
      },
    });
  }

  prismaClient = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return prismaClient;
}

export const prisma = getPrisma();
