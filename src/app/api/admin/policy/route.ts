import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/admin-auth'
import { getEffectiveAdminAllowedKeys, setAdminAllowedKeys } from '@/lib/admin-policy'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowedContentKeys = await getEffectiveAdminAllowedKeys()
  return NextResponse.json({ allowedContentKeys })
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const allowedContentKeys = Array.isArray(body?.allowedContentKeys)
    ? body.allowedContentKeys.map((k: unknown) => String(k))
    : null

  if (!allowedContentKeys) {
    return NextResponse.json({ error: 'allowedContentKeys 배열이 필요합니다.' }, { status: 400 })
  }

  const { error, keys } = await setAdminAllowedKeys(allowedContentKeys)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, allowedContentKeys: keys })
}
