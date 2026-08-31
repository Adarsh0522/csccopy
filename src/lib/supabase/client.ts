import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use non-null assertion or fallback for placeholder
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}
