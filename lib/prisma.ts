import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
    // Keep pool intentionally small: with Next dev/build workers + PgBouncer (session mode),
    // it's easy to hit "MaxClientsInSessionMode" and get 500s across the app.
    // You can override via PG_POOL_MAX if needed.
    const max = Math.max(1, parseInt(process.env.PG_POOL_MAX || "1", 10) || 1)
    globalForPrisma.pool = new pg.Pool({
      connectionString,
      max,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  const adapter = new PrismaPg(globalForPrisma.pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
