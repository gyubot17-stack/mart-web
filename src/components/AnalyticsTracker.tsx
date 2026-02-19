'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function getSource() {
  if (typeof document === 'undefined') return 'unknown'
  const ref = document.referrer
  if (!ref) return 'direct'

  try {
    const host = new URL(ref).hostname.replace(/^www\./, '')
    if (host.includes('google')) return 'google'
    if (host.includes('naver')) return 'naver'
    if (host.includes('daum')) return 'daum'
    if (host.includes('bing')) return 'bing'
    return host || 'referral'
  } catch {
    return 'referral'
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return

    const source = getSource()
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, source }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
