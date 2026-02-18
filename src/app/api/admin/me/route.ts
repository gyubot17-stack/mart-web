import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const raw = (await cookies()).get('admin_session')?.value
  if (!raw) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [role, token] = raw.split(':')
  if (!token || (role !== 'admin' && role !== 'super')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expected = role === 'super'
    ? process.env.SUPER_ADMIN_SESSION_TOKEN
    : process.env.ADMIN_SESSION_TOKEN

  if (!expected || expected !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ role })
}
