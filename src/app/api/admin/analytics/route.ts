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

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('key,title,subtitle,body')
    .like('key', 'analytics_%')
    .order('key', { ascending: false })
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []).map((row) => {
    let parsed: any = {}
    try { parsed = JSON.parse(row.body || '{}') } catch {}
    const createdAt = parsed?.createdAt ? new Date(parsed.createdAt) : null
    return {
      path: parsed?.path || row.title || '/',
      source: parsed?.source || row.subtitle || 'direct',
      createdAt,
    }
  }).filter((r) => r.createdAt)

  const fromDate = from ? new Date(from) : null
  const toDate = to ? new Date(to) : null

  const filtered = rows.filter((r) => {
    const t = r.createdAt!.getTime()
    if (fromDate && t < fromDate.getTime()) return false
    if (toDate && t > toDate.getTime()) return false
    return true
  })

  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000

  const totalDay = rows.filter((r) => r.createdAt!.getTime() >= dayAgo).length
  const totalMonth = rows.filter((r) => r.createdAt!.getTime() >= monthAgo).length

  const sourceMap = new Map<string, number>()
  const pathMap = new Map<string, number>()

  for (const row of filtered) {
    sourceMap.set(row.source, (sourceMap.get(row.source) || 0) + 1)
    pathMap.set(row.path, (pathMap.get(row.path) || 0) + 1)
  }

  const sources = [...sourceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }))

  const topPages = [...pathMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([path, count]) => ({ path, count }))

  return NextResponse.json({
    rangeTotal: filtered.length,
    totalDay,
    totalMonth,
    sources,
    topPages,
  })
}
