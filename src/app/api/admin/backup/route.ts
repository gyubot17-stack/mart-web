import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

function ensureSuper(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const denied = ensureSuper(request)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    count: data?.length ?? 0,
    rows: data ?? [],
  })
}

export async function POST(request: NextRequest) {
  const denied = ensureSuper(request)
  if (denied) return denied

  const body = await request.json()
  const rows = body?.rows

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows 배열이 필요합니다.' }, { status: 400 })
  }

  const sanitized = rows
    .filter((row) => typeof row?.key === 'string')
    .map((row) => ({
      key: row.key,
      title: row.title ?? '',
      subtitle: row.subtitle ?? '',
      body: row.body ?? '',
      hero_image_url: row.hero_image_url ?? '',
    }))

  const { error } = await supabaseAdmin
    .from('site_content')
    .upsert(sanitized, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, restored: sanitized.length })
}
