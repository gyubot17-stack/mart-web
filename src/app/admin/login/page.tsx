'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json?.error ?? '로그인 실패')
      setLoading(false)
      return
    }

    const next = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') || '/admin'
      : '/admin'
    router.replace(next)
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl border p-6 space-y-4">
        <h1 className="text-xl font-bold">Admin 로그인</h1>
        <p className="text-sm text-gray-600">아이디/비밀번호로 로그인합니다.</p>
        <input
          type="text"
          placeholder="관리자 아이디"
          className="w-full border rounded px-3 py-2"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          type="password"
          placeholder="관리자 비밀번호"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  )
}
