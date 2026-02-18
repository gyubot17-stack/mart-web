import { NextResponse } from 'next/server'
import { createSessionCookieValue } from '@/lib/admin-auth'
import { validateLoginCredentials } from '@/lib/admin-password'

type Attempt = { fails: number; blockedUntil: number }

const attempts = new Map<string, Attempt>()
const MAX_FAILS = 5
const BLOCK_MS = 10 * 60 * 1000

function getClientKey(request: Request, id?: string) {
  const fwd = request.headers.get('x-forwarded-for') || 'unknown'
  const ip = fwd.split(',')[0]?.trim() || 'unknown'
  return `${ip}:${id || 'no-id'}`
}

function isBlocked(key: string) {
  const found = attempts.get(key)
  if (!found) return false
  if (Date.now() > found.blockedUntil) {
    attempts.delete(key)
    return false
  }
  return found.blockedUntil > Date.now()
}

function markFailure(key: string) {
  const found = attempts.get(key) || { fails: 0, blockedUntil: 0 }
  found.fails += 1
  if (found.fails >= MAX_FAILS) {
    found.blockedUntil = Date.now() + BLOCK_MS
  }
  attempts.set(key, found)
}

function clearFailure(key: string) {
  attempts.delete(key)
}

export async function POST(request: Request) {
  const { id, password } = await request.json()

  if (!process.env.ADMIN_ID || !process.env.SUPER_ADMIN_ID) {
    return NextResponse.json(
      { error: 'Server auth env is not configured' },
      { status: 500 },
    )
  }

  const attemptKey = getClientKey(request, id)
  if (isBlocked(attemptKey)) {
    return NextResponse.json(
      { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 },
    )
  }

  const role = validateLoginCredentials(id, password)

  if (!role) {
    markFailure(attemptKey)
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  clearFailure(attemptKey)

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
    maxAge: 60 * 60 * 12,
  })
  return res
}
