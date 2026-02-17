import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    // Choose the best runtime connection string:
    // - Prefer DIRECT_URL when it is truly a *direct* DB host (e.g. `db.<ref>.supabase.co`).
    // - Avoid using Supabase pooler URLs as DIRECT_URL (session mode can hit MaxClientsInSessionMode).
    // - Fall back to DATABASE_URL (PgBouncer) when DIRECT_URL is missing or is a pooler URL.
    const direct = process.env.DIRECT_URL
    const pooled = process.env.DATABASE_URL
    const isPoolerUrl = (raw?: string) => {
      if (!raw) return false
      return /pooler\\.supabase\\.com/i.test(raw) || /pgbouncer=true/i.test(raw)
    }

    const connectionString = direct && !isPoolerUrl(direct) ? direct : pooled || direct
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL/DIRECT_URL env var for Prisma")
    }
    // Keep pool intentionally small: with Next dev/build workers + PgBouncer (session mode),
    // it's easy to hit "MaxClientsInSessionMode" and get 500s across the app.
    // You can override via PG_POOL_MAX if needed.
    const max = Math.max(1, parseInt(process.env.PG_POOL_MAX || "1", 10) || 1)

    // Supabase requires TLS for external connections. Without SSL, connections can be
    // terminated unexpectedly (often surfacing as timeouts).
    // Allow opting out explicitly (e.g. local Postgres) via PG_SSL=false.
    const shouldUseSsl =
      process.env.PG_SSL === "false"
        ? false
        : /supabase\.co|supabase\.com/i.test(connectionString)

    globalForPrisma.pool = new pg.Pool({
      connectionString,
      max,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : null),
    })
  }
  const adapter = new PrismaPg(globalForPrisma.pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
