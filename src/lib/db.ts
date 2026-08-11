import { PrismaClient } from "@prisma/client";

// Next.js 개발 모드의 HMR 로 커넥션이 계속 늘어나는 것을 막기 위해 전역에 캐싱한다.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
