import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json()

  if (body?.website) {
    return NextResponse.json({ ok: true })
  }

  const name = String(body?.name || '').trim()
  const phone = String(body?.phone || '').trim()
  const message = String(body?.message || '').trim()

  if (!name || !phone || !message) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
  }

  const key = `inquiry_${Date.now()}`
  const payload = {
    key,
    title: `문의 - ${name}`,
    subtitle: phone,
    body: JSON.stringify({ name, phone, message, createdAt: new Date().toISOString() }),
    hero_image_url: '',
  }

  const { error } = await supabaseAdmin.from('site_content').insert(payload)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
