import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/admin-auth'
import { getEffectiveAdminAllowedKeys } from '@/lib/admin-policy'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = await getEffectiveAdminAllowedKeys()

  return NextResponse.json({
    role: session.role,
    allowedContentKeys: session.role === 'super' ? ['*'] : allowed,
  })
}
