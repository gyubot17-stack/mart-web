import { NextRequest, NextResponse } from 'next/server'
import { getAdminAllowedContentKeys, getSessionFromRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    role: session.role,
    allowedContentKeys: session.role === 'super' ? ['*'] : getAdminAllowedContentKeys(),
  })
}
