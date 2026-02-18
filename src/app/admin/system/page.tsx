'use client'

import { useEffect, useState } from 'react'

type Account = {
  role: 'super' | 'admin'
  name: string
  permissions: string[]
}

export default function AdminSystemPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    ;(async () => {
      const me = await fetch('/api/admin/me', { cache: 'no-store' })
      if (!me.ok) {
        window.location.href = '/admin/login'
        return
      }

      const meJson = await me.json()
      if (meJson?.role !== 'super') {
        setError('슈퍼관리자만 접근할 수 있습니다.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin/accounts', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? '불러오기에 실패했습니다.')
      } else {
        setAccounts(json.accounts ?? [])
      }
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return <main className="min-h-screen p-8">불러오는 중...</main>
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">슈퍼관리자 - 시스템/계정 관리</h1>
      {error ? <p className="text-red-600">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">계정 권한 정책</h2>
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc.role} className="border rounded p-4">
              <p className="font-medium">{acc.name} ({acc.role})</p>
              <p className="text-sm text-gray-600 mt-2">권한: {acc.permissions.join(', ')}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border rounded p-4 bg-amber-50 text-sm text-amber-900">
        현재 1차 버전에서는 권한 분리와 접근 제어를 우선 적용했습니다.
        다음 단계에서 실제 계정 추가/비활성화 UI(데이터베이스 기반)까지 확장할 수 있습니다.
      </section>
    </main>
  )
}
