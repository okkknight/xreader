import { PrismaClient } from "@prisma/client";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const configuredUrl = process.env.DATABASE_URL;
const databaseUrl = configuredUrl?.startsWith("file:../data/")
  ? `file:${path.resolve(process.cwd(), "data", configuredUrl.slice("file:../data/".length))}`
  : configuredUrl;

export const prisma = globalForPrisma.prisma ?? new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
