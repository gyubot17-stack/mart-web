import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const CONTENT_KEY = 'home'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', CONTENT_KEY)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  const body = await request.json()

  const payload = {
    title: body.title ?? '',
    subtitle: body.subtitle ?? '',
    body: body.body ?? '',
    hero_image_url: body.hero_image_url ?? '',
  }

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .update(payload)
    .eq('key', CONTENT_KEY)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
