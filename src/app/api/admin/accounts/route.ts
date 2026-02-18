import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function isSuper() {
  return cookies().then((store) => {
    const raw = store.get('admin_session')?.value
    if (!raw) return false

    const [role, token] = raw.split(':')
    if (role !== 'super' || !token) return false

    const expected = process.env.SUPER_ADMIN_SESSION_TOKEN
    if (!expected) return false

    return token === expected
  })
}

export async function GET() {
  if (!(await isSuper())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    accounts: [
      { role: 'super', name: '시스템 운영자', permissions: ['content:read', 'content:write', 'assets:upload', 'accounts:manage', 'system:manage'] },
      { role: 'admin', name: '일반 관리자', permissions: ['content:read', 'content:write', 'assets:upload'] },
    ],
  })
}
