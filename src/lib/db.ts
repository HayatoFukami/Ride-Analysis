import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Convert a `file:`-prefixed Prisma SQLite URL into a path accepted by
 * better-sqlite3 (which does not understand the `file:` URI scheme).
 */
function toSqlitePath(url: string): string {
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }
  return url;
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: toSqlitePath(databaseUrl) });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}