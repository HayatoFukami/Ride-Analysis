import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";

// Explicitly load environment files for the Prisma CLI. `.env.local` is loaded
// first and takes priority (process.loadEnvFile does not override variables
// already present), then `.env` fills in anything missing.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
