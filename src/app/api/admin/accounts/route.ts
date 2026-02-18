import { NextRequest, NextResponse } from 'next/server'
import { getAdminAllowedContentKeys, getSessionFromRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminAllowed = getAdminAllowedContentKeys()

  return NextResponse.json({
    accounts: [
      {
        role: 'super',
        name: '시스템 운영자',
        permissions: ['content:*', 'assets:upload', 'accounts:manage', 'system:manage', 'backup:manage'],
      },
      {
        role: 'admin',
        name: '일반 관리자',
        permissions: ['content:partial', 'assets:upload'],
        allowedContentKeys: adminAllowed,
      },
    ],
  })
}
