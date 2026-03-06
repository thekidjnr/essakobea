import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Only use in API routes (server-side).
// Lazy singleton to avoid build-time initialization failure when env vars aren't set.
let _instance: SupabaseClient | null = null

function getInstance(): SupabaseClient {
  if (!_instance) {
    _instance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _instance
}

export const adminDb = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getInstance()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
