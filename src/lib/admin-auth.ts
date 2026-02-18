import type { NextRequest } from 'next/server'

export type AdminRole = 'admin' | 'super'

const COOKIE_NAME = 'admin_session'
const DEFAULT_ADMIN_ALLOWED_KEYS = [
  'home',
  'company',
  'compressor',
  'air-cleaning',
  'generator',
  'eco-energy',
  'industrial',
  'records',
  'special-sale',
  'as',
  'support',
  'menu_config',
]

export type AdminSession = {
  role: AdminRole
}

function tokenForRole(role: AdminRole): string | undefined {
  if (role === 'super') return process.env.SUPER_ADMIN_SESSION_TOKEN
  return process.env.ADMIN_SESSION_TOKEN
}

export function createSessionCookieValue(role: AdminRole): string | null {
  const token = tokenForRole(role)
  if (!token) return null
  return `${role}:${token}`
}

export function getSessionFromCookieValue(raw?: string): AdminSession | null {
  if (!raw) return null

  const [role, token] = raw.split(':')
  if ((role !== 'admin' && role !== 'super') || !token) return null

  const expected = tokenForRole(role)
  if (!expected || expected !== token) return null

  return { role }
}

export function getSessionFromRequest(req: NextRequest): AdminSession | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value
  return getSessionFromCookieValue(raw)
}

export function getRoleFromRequest(req: NextRequest): AdminRole | null {
  return getSessionFromRequest(req)?.role ?? null
}

export function getAdminAllowedContentKeys(): string[] {
  const raw = process.env.ADMIN_ALLOWED_KEYS
  if (!raw?.trim()) return DEFAULT_ADMIN_ALLOWED_KEYS

  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

export function canEditContent(role: AdminRole, key: string): boolean {
  if (role === 'super') return true

  const allowed = getAdminAllowedContentKeys()
  if (allowed.includes(key)) return true

  // section extra payload (e.g. company_extra) follows the same permission as company
  if (key.endsWith('_extra')) {
    const baseKey = key.replace(/_extra$/, '')
    return allowed.includes(baseKey)
  }

  return false
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
