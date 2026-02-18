'use client'

import { useEffect, useState } from 'react'

type Content = {
  key: string
  title: string
  subtitle: string
  body: string
  hero_image_url: string
}

const sections = [
  { key: 'home', label: '홈' },
  { key: 'company', label: '회사소개' },
  { key: 'compressor', label: '콤프레샤' },
  { key: 'air-cleaning', label: '에어크리닝시스템' },
  { key: 'generator', label: '발전기' },
  { key: 'eco-energy', label: '친환경에너지' },
  { key: 'industrial', label: '산업기계' },
  { key: 'records', label: '거래실적' },
  { key: 'special-sale', label: '특가판매' },
  { key: 'as', label: '제품AS' },
  { key: 'support', label: '고객센터' },
]

const initial: Content = {
  key: 'home',
  title: '',
  subtitle: '',
  body: '',
  hero_image_url: '',
}

export default function AdminPage() {
  const [content, setContent] = useState<Content>(initial)
  const [selectedKey, setSelectedKey] = useState('home')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [role, setRole] = useState<'admin' | 'super' | null>(null)

  async function loadContent(key: string) {
    const res = await fetch(`/api/content?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
    const json = await res.json()
    if (json?.data) {
      setContent({
        key,
        title: json.data.title ?? '',
        subtitle: json.data.subtitle ?? '',
        body: json.data.body ?? '',
        hero_image_url: json.data.hero_image_url ?? '',
      })
    }
  }

  useEffect(() => {
    ;(async () => {
      const me = await fetch('/api/admin/me', { cache: 'no-store' })
      if (me.ok) {
        const meJson = await me.json()
        setRole(meJson?.role ?? null)
      }

      await loadContent('home')
      setLoading(false)
    })()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('저장 중...')
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(`저장 실패: ${json?.error ?? 'unknown'}`)
    } else {
      setContent({
        key: content.key,
        title: json.data.title ?? '',
        subtitle: json.data.subtitle ?? '',
        body: json.data.body ?? '',
        hero_image_url: json.data.hero_image_url ?? '',
      })
      setMessage('저장 완료 ✅')
    }
    setSaving(false)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setMessage('이미지 업로드 중...')
    const fd = new FormData()
    fd.append('file', file)

    const up = await fetch('/api/upload', {
      method: 'POST',
      body: fd,
    })
    const upJson = await up.json()
    if (!up.ok) {
      setMessage(`업로드 실패: ${upJson?.error ?? 'unknown'}`)
      setUploading(false)
      return
    }

    const next = { ...content, hero_image_url: upJson.url }
    setContent(next)
    setMessage('이미지 업로드 완료. 저장 버튼을 눌러 반영하세요.')
    setUploading(false)
  }

  if (loading) {
    return <main className="min-h-screen p-10">불러오는 중...</main>
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin - 콘텐츠 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          {role === 'super' ? (
            <a href="/admin/system" className="px-3 py-2 text-sm rounded border">
              시스템/계정 관리
            </a>
          ) : null}
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

      <div className="space-y-2">
        <label className="text-sm font-medium">편집할 페이지</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedKey}
          onChange={async (e) => {
            const key = e.target.value
            setSelectedKey(key)
            setLoading(true)
            await loadContent(key)
            setMessage('')
            setLoading(false)
          }}
        >
          {sections.map((section) => (
            <option key={section.key} value={section.key}>
              {section.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">제목</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={content.title}
          onChange={(e) => setContent({ ...content, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">부제목</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={content.subtitle}
          onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">본문</label>
        <textarea
          className="w-full border rounded px-3 py-2 min-h-40"
          value={content.body}
          onChange={(e) => setContent({ ...content, body: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">대표 이미지</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
          }}
        />
        {content.hero_image_url ? (
          <img
            src={content.hero_image_url}
            alt="hero"
            className="w-full max-h-72 object-cover rounded border"
          />
        ) : (
          <p className="text-sm text-gray-500">이미지 없음</p>
        )}
      </div>

      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={saving || uploading}
        onClick={handleSave}
      >
        {saving ? '저장 중...' : '저장'}
      </button>

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </main>
  )
}
