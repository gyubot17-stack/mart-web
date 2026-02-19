import { getAdminAllowedContentKeys as getEnvAllowedKeys } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

type PolicyDoc = {
  allowedContentKeys?: string[]
}

const POLICY_KEY = 'admin_policy'

export async function getEffectiveAdminAllowedKeys(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('site_content')
    .select('body')
    .eq('key', POLICY_KEY)
    .maybeSingle()

  if (data?.body) {
    try {
      const parsed = JSON.parse(data.body) as PolicyDoc
      if (Array.isArray(parsed.allowedContentKeys) && parsed.allowedContentKeys.length > 0) {
        return parsed.allowedContentKeys.map((k) => String(k).trim()).filter(Boolean)
      }
    } catch {
      // fallback to env
    }
  }

  return getEnvAllowedKeys()
}

export async function setAdminAllowedKeys(keys: string[]) {
  const cleaned = keys.map((k) => k.trim()).filter(Boolean)

  const { error } = await supabaseAdmin
    .from('site_content')
    .upsert(
      {
        key: POLICY_KEY,
        title: 'admin policy',
        subtitle: '',
        body: JSON.stringify({ allowedContentKeys: cleaned }),
        hero_image_url: '',
      },
      { onConflict: 'key' },
    )

  return { error, keys: cleaned }
}

export function canEditWithAllowedKeys(role: 'admin' | 'super', key: string, allowed: string[]) {
  if (role === 'super') return true
  if (allowed.includes(key)) return true
  if (key.endsWith('_extra')) {
    const baseKey = key.replace(/_extra$/, '')
    return allowed.includes(baseKey)
  }
  if (key.endsWith('_style')) {
    const baseKey = key.replace(/_style$/, '')
    return allowed.includes(baseKey)
  }
  return false
}
