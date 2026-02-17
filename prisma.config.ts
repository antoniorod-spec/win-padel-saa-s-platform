import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use DIRECT_URL for Prisma CLI/migrations when available.
    // Poolers (PgBouncer) can time out or be incompatible for migrate/introspect.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
