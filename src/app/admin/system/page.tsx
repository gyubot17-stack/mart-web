'use client'

import { useEffect, useState } from 'react'

type Account = {
  role: 'super' | 'admin'
  name: string
  permissions: string[]
  allowedContentKeys?: string[]
}


export default function AdminSystemPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [backupJson, setBackupJson] = useState('')
  const [allowedKeysInput, setAllowedKeysInput] = useState('')

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

      const [accountsRes, policyRes] = await Promise.all([
        fetch('/api/admin/accounts', { cache: 'no-store' }),
        fetch('/api/admin/policy', { cache: 'no-store' }),
      ])

      const accountsJson = await accountsRes.json()
      if (!accountsRes.ok) {
        setError(accountsJson?.error ?? '불러오기에 실패했습니다.')
      } else {
        setAccounts(accountsJson.accounts ?? [])
      }

      const policyJson = await policyRes.json()
      if (policyRes.ok && Array.isArray(policyJson?.allowedContentKeys)) {
        setAllowedKeysInput(policyJson.allowedContentKeys.join(', '))
      }

      setLoading(false)
    })()
  }, [])

  async function saveAdminPolicy() {
    const allowedContentKeys = allowedKeysInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    if (allowedContentKeys.length === 0) {
      setMessage('최소 1개 이상의 키를 입력해주세요.')
      return
    }

    setMessage('일반관리자 권한 저장 중...')
    const res = await fetch('/api/admin/policy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedContentKeys }),
    })
    const json = await res.json()

    if (!res.ok) {
      setMessage(`권한 저장 실패: ${json?.error ?? 'unknown'}`)
      return
    }

    setMessage('일반관리자 편집 권한 저장 완료 ✅')

    const accountsRes = await fetch('/api/admin/accounts', { cache: 'no-store' })
    const accountsJson = await accountsRes.json()
    if (accountsRes.ok) {
      setAccounts(accountsJson.accounts ?? [])
    }
  }

  async function exportBackup() {
    setMessage('백업 내보내는 중...')
    const res = await fetch('/api/admin/backup', { cache: 'no-store' })
    const json = await res.json()

    if (!res.ok) {
      setMessage(`백업 실패: ${json?.error ?? 'unknown'}`)
      return
    }

    const stamp = new Date()
    const version = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}${String(stamp.getSeconds()).padStart(2, '0')}`

    const payload = { version, ...json }
    const text = JSON.stringify(payload, null, 2)
    setBackupJson(text)
    setMessage(`백업 생성 완료 ✅ (버전: ${version})`)

    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mrtc-backup-${version}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function restoreBackup() {
    if (!backupJson.trim()) {
      setMessage('복원할 JSON을 먼저 입력하세요.')
      return
    }

    let parsed: any
    try {
      parsed = JSON.parse(backupJson)
    } catch {
      setMessage('JSON 형식이 올바르지 않습니다.')
      return
    }

    const rows = Array.isArray(parsed?.rows) ? parsed.rows : null
    if (!rows) {
      setMessage('복원 JSON에 rows 배열이 필요합니다.')
      return
    }

    setMessage('복원 중...')
    const res = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const json = await res.json()

    if (!res.ok) {
      setMessage(`복원 실패: ${json?.error ?? 'unknown'}`)
      return
    }

    setMessage(`복원 완료 ✅ (${json?.restored ?? 0}건)`)
  }

  if (loading) {
    return <main className="min-h-screen p-8">불러오는 중...</main>
  }

  return (
    <main className="min-h-screen pb-8 max-w-4xl mx-auto space-y-6">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin - 시스템/계정 관리</h1>
        <div className="flex items-center gap-2">
          <a href="/admin" className="admin-btn px-3 py-2 text-sm rounded border">콘텐츠 관리</a>
          <a href="/admin/menu" className="admin-btn px-3 py-2 text-sm rounded border">메뉴관리</a>
          <a href="/admin/common" className="admin-btn px-3 py-2 text-sm rounded border">공통 관리</a>
          <a href="/admin/system" className="admin-btn px-3 py-2 text-sm rounded border">시스템/계정 관리</a>
          <button
            className="px-3 py-2 text-sm rounded border"
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' })
              window.location.href = '/admin/login'
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="px-8 pt-6 space-y-6">
      {error ? <p className="text-red-600">{error}</p> : null}

      <section className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">계정 권한 정책</h2>
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc.role} className="border rounded p-4 space-y-2">
              <p className="font-medium">{acc.name} ({acc.role === 'super' ? '슈퍼관리자' : '일반관리자'})</p>
              <p className="text-sm text-gray-600">권한: {(acc.permissions ?? []).join(', ') || '-'}</p>
              {acc.allowedContentKeys ? (
                <p className="text-sm text-gray-600">편집 가능 페이지: {acc.allowedContentKeys.join(', ')}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">일반관리자 편집 권한 설정</h2>
        <p className="text-sm text-gray-600">
          쉼표(,)로 구분해서 입력하세요. 예: home,special-sale,support
        </p>
        <input
          className="w-full border rounded px-3 py-2"
          value={allowedKeysInput}
          onChange={(e) => setAllowedKeysInput(e.target.value)}
        />
        <button className="px-4 py-2 rounded border" onClick={saveAdminPolicy}>권한 저장</button>
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">콘텐츠 백업 / 복구</h2>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded border" onClick={exportBackup}>백업 내보내기</button>
          <button className="px-4 py-2 rounded border" onClick={restoreBackup}>JSON으로 복구</button>
        </div>
        <textarea
          className="w-full border rounded p-3 min-h-56 text-sm font-mono"
          placeholder="백업 JSON을 붙여넣은 뒤 'JSON으로 복구'를 누르세요"
          value={backupJson}
          onChange={(e) => setBackupJson(e.target.value)}
        />
      </section>

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}

      {message ? (
        <div className="fixed right-6 bottom-6 z-50 max-w-md rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-slate-800">{message}</p>
        </div>
      ) : null}
      </div>
    </main>
  )
}
