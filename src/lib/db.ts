import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { pgConnectionOptions } from "@/lib/dbConnection";

/**
 * One Prisma client per process, on Postgres (Railway in production, the
 * embedded dev server locally: `npm run db:local`). The pool stays small.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Importing the client must not crash (`next build` page collection); a
// missing URL fails on the first query instead, with this hint in the logs.
const UNCONFIGURED = "postgresql://set-DATABASE_URL@127.0.0.1:1/unconfigured";

function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString || !/^postgres(ql)?:\/\//i.test(connectionString)) {
    console.warn("[prisma] DATABASE_URL is not a Postgres connection string (postgresql://…); queries will fail.");
    connectionString = UNCONFIGURED;
  }
  const adapter = new PrismaPg({
    ...pgConnectionOptions(connectionString),
    max: Number(process.env.PG_POOL_MAX ?? 6),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
