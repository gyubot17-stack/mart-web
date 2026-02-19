import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const MAX_UPLOAD_MB = 10
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `파일 용량이 너무 큽니다. ${MAX_UPLOAD_MB}MB 이하로 업로드해주세요.` }, { status: 413 })
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
