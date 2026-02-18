import { scryptSync, timingSafeEqual } from 'node:crypto'
import type { AdminRole } from '@/lib/admin-auth'

function parseScryptHash(hash: string): { salt: Buffer; key: Buffer } | null {
  const [algo, saltB64, keyB64] = hash.split(':')
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return null

  try {
    return {
      salt: Buffer.from(saltB64, 'base64'),
      key: Buffer.from(keyB64, 'base64'),
    }
  } catch {
    return null
  }
}

function verifyPassword(input: string, plain?: string, hash?: string): boolean {
  if (!input) return false

  if (hash) {
    const parsed = parseScryptHash(hash)
    if (!parsed) return false

    const derived = scryptSync(input, parsed.salt, parsed.key.length)
    return timingSafeEqual(derived, parsed.key)
  }

  if (!plain) return false
  return input === plain
}

export function validateLoginCredentials(id: string, password: string): AdminRole | null {
  const adminId = process.env.ADMIN_ID
  const superAdminId = process.env.SUPER_ADMIN_ID

  if (!adminId || !superAdminId) return null

  const isSuper =
    id === superAdminId &&
    verifyPassword(password, process.env.SUPER_ADMIN_PASSWORD, process.env.SUPER_ADMIN_PASSWORD_HASH)

  if (isSuper) return 'super'

  const isAdmin =
    id === adminId &&
    verifyPassword(password, process.env.ADMIN_PASSWORD, process.env.ADMIN_PASSWORD_HASH)

  if (isAdmin) return 'admin'

  return null
}
