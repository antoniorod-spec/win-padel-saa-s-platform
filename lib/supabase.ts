import { createClient } from "@supabase/supabase-js"

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function getSupabaseAdminClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
