import type { NextRequest } from 'next/server'

export type AdminRole = 'admin' | 'super'

const COOKIE_NAME = 'admin_session'

function tokenForRole(role: AdminRole): string | undefined {
  if (role === 'super') return process.env.SUPER_ADMIN_SESSION_TOKEN
  return process.env.ADMIN_SESSION_TOKEN
}

export function createSessionCookieValue(role: AdminRole): string | null {
  const token = tokenForRole(role)
  if (!token) return null
  return `${role}:${token}`
}

export function getRoleFromRequest(req: NextRequest): AdminRole | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value
  if (!raw) return null

  const [role, token] = raw.split(':')
  if ((role !== 'admin' && role !== 'super') || !token) return null

  const expected = tokenForRole(role)
  if (!expected || expected !== token) return null

  return role
}

export function isAuthorized(req: NextRequest, requiredRole: AdminRole = 'admin'): boolean {
  const role = getRoleFromRequest(req)
  if (!role) return false
  if (requiredRole === 'admin') return true
  return role === 'super'
}

export function clearSessionCookie(res: Response | any) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
