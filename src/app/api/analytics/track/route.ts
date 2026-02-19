import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json()
  const path = String(body?.path || '/').slice(0, 200)
  const source = String(body?.source || 'direct').slice(0, 100)

  const key = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const payload = {
    key,
    title: path,
    subtitle: source,
    body: JSON.stringify({ path, source, createdAt: new Date().toISOString() }),
    hero_image_url: '',
  }

  const { error } = await supabaseAdmin.from('site_content').insert(payload)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
