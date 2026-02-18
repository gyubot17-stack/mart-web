import { NextResponse } from 'next/server'
import { createSessionCookieValue } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const { id, password } = await request.json()

  const adminId = process.env.ADMIN_ID
  const adminPassword = process.env.ADMIN_PASSWORD
  const superAdminId = process.env.SUPER_ADMIN_ID
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

  if (!adminId || !adminPassword || !superAdminId || !superAdminPassword) {
    return NextResponse.json(
      { error: 'Server auth env is not configured' },
      { status: 500 },
    )
  }

  let role: 'admin' | 'super' | null = null

  if (id === superAdminId && password === superAdminPassword) {
    role = 'super'
  } else if (id === adminId && password === adminPassword) {
    role = 'admin'
  }

  if (!role) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const cookieValue = createSessionCookieValue(role)
  if (!cookieValue) {
    return NextResponse.json({ error: 'Session token is not configured' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true, role })
  res.cookies.set('admin_session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
