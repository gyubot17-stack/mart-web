import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const path = `hero-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('site-assets')
    .upload(path, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicData } = supabaseAdmin.storage
    .from('site-assets')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicData.publicUrl, path })
}
