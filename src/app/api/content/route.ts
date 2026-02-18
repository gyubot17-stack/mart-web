import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/admin-auth'
import { canEditWithAllowedKeys, getEffectiveAdminAllowedKeys } from '@/lib/admin-policy'
import { supabaseAdmin } from '@/lib/supabase-server'

const DEFAULT_CONTENT_KEY = 'home'

async function ensureKeyAccess(request: NextRequest, key: string) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = await getEffectiveAdminAllowedKeys()
  if (!canEditWithAllowedKeys(session.role, key, allowed)) {
    return NextResponse.json({ error: 'Forbidden: 이 페이지는 수정 권한이 없습니다.' }, { status: 403 })
  }

  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key') || DEFAULT_CONTENT_KEY

  const denied = await ensureKeyAccess(request, key)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', key)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? {
      key,
      title: '',
      subtitle: '',
      body: '',
      hero_image_url: '',
    },
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const key = body.key ?? DEFAULT_CONTENT_KEY

  const denied = await ensureKeyAccess(request, key)
  if (denied) return denied

  const payload = {
    key,
    title: body.title ?? '',
    subtitle: body.subtitle ?? '',
    body: body.body ?? '',
    hero_image_url: body.hero_image_url ?? '',
  }

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .upsert(payload, { onConflict: 'key' })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
