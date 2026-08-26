import { PrismaClient } from "@prisma/client";

if (process.env.VERCEL && !process.env.DATABASE_URL?.trim()) {
  console.error(
    "DATABASE_URL is missing. Set it in the Vercel project environment variables.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
