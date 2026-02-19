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
    .select('key,title,subtitle,body')
    .like('key', 'inquiry_%')
    .order('key', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const inquiries = (data ?? []).map((row) => {
    let parsed: any = {}
    try { parsed = JSON.parse(row.body || '{}') } catch {}

    return {
      key: row.key,
      name: parsed?.name || row.title?.replace('문의 - ', '') || '',
      phone: parsed?.phone || row.subtitle || '',
      message: parsed?.message || '',
      note: parsed?.note || '',
      createdAt: parsed?.createdAt || null,
      status: parsed?.status || 'new',
    }
  })

  return NextResponse.json({ inquiries })
}

export async function PATCH(request: NextRequest) {
  const denied = ensureSuper(request)
  if (denied) return denied

  const body = await request.json()
  const key = String(body?.key || '')
  const status = String(body?.status || '')
  const note = typeof body?.note === 'string' ? body.note : null

  if (!key.startsWith('inquiry_') || (!['new', 'done'].includes(status) && note === null)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { data: found, error: findError } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', key)
    .single()

  if (findError || !found) {
    return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 })
  }

  let parsed: any = {}
  try { parsed = JSON.parse(found.body || '{}') } catch {}
  if (['new', 'done'].includes(status)) parsed.status = status
  if (note !== null) parsed.note = note

  const { error } = await supabaseAdmin
    .from('site_content')
    .update({ body: JSON.stringify(parsed) })
    .eq('key', key)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const denied = ensureSuper(request)
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const key = String(searchParams.get('key') || '')

  if (!key.startsWith('inquiry_')) {
    return NextResponse.json({ error: '잘못된 key입니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('site_content')
    .delete()
    .eq('key', key)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
