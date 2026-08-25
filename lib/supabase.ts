import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type Project = {
  id: string
  label: string
  year: string
  tag: string
  description: string
  client: string
  color: string
  shape: 'circle' | 'square' | 'diamond'
  images: string[]
  thumbnail: string
  order_index: number
  created_at: string
}

// Lazy singleton — safe to import in both client and server components
const SUPABASE_URL = 'https://ahqwlxprkgzouoxkpnuc.supabase.co'

let _client: SupabaseClient | null = null
export function getSupabase() {
  if (!_client) {
    _client = createClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _client
}

// Server-only service-role client (bypasses RLS — only call from API routes)
export function createServiceClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
