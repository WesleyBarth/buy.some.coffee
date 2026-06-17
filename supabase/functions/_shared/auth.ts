import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SupabaseUser = {
  id: string
  email?: string
}

export function requireEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function getSupabaseKey(keyFamily: 'publishable' | 'secret') {
  const pluralName = keyFamily === 'publishable' ? 'SUPABASE_PUBLISHABLE_KEYS' : 'SUPABASE_SECRET_KEYS'
  const singleName = keyFamily === 'publishable' ? 'SUPABASE_PUBLISHABLE_KEY' : 'SUPABASE_SECRET_KEY'
  const legacyName = keyFamily === 'publishable' ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY'
  const keysJson = Deno.env.get(pluralName)

  if (keysJson) {
    const keys = JSON.parse(keysJson) as Record<string, string | undefined>
    const key = keys.default ?? Object.values(keys).find(Boolean)
    if (key) return key
  }

  const fallback = Deno.env.get(singleName) ?? Deno.env.get(legacyName)
  if (!fallback) throw new Error(`Missing ${pluralName}`)
  return fallback
}

export function getSupabaseAdmin() {
  return createClient(requireEnv('SUPABASE_URL'), getSupabaseKey('secret'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function requireUser(req: Request): Promise<SupabaseUser> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing Authorization header')

  const supabase = createClient(requireEnv('SUPABASE_URL'), getSupabaseKey('publishable'), {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Invalid or expired session')

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
  }
}
