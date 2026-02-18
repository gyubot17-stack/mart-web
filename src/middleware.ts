import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthorized } from '@/lib/admin-auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const protectedPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const protectedApi =
    pathname === '/api/content' ||
    pathname === '/api/upload' ||
    pathname === '/api/admin/me' ||
    pathname === '/api/admin/accounts' ||
    pathname === '/api/admin/backup'

  if (!protectedPage && !protectedApi) return NextResponse.next()

  const needsSuper =
    pathname.startsWith('/admin/system') ||
    pathname === '/api/admin/accounts' ||
    pathname === '/api/admin/backup'
  const ok = isAuthorized(req, needsSuper ? 'super' : 'admin')

  if (ok) return NextResponse.next()

  if (protectedApi) {
    return NextResponse.json(
      { error: needsSuper ? 'Forbidden' : 'Unauthorized' },
      { status: needsSuper ? 403 : 401 },
    )
  }

  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/content',
    '/api/upload',
    '/api/admin/me',
    '/api/admin/accounts',
    '/api/admin/backup',
  ],
}
