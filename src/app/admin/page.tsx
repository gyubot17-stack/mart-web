'use client'

import { useEffect, useMemo, useState } from 'react'

type Content = {
  key: string
  title: string
  subtitle: string
  body: string
  hero_image_url: string
}

type GalleryItem = {
  url: string
  visible: boolean
}

type Product = {
  name: string
  desc: string
  image: string
  link: string
  visible: boolean
}

type SectionExtra = {
  gallery: GalleryItem[]
  products: Product[]
}

type StyleConfig = {
  heroHeight: number
  galleryHeight: number
  productHeight: number
}

type SubmenuItem = {
  label: string
  href: string
  visible: boolean
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

const defaultExtra: SectionExtra = {
  gallery: [],
  products: [],
}

const defaultStyle: StyleConfig = {
  heroHeight: 420,
  galleryHeight: 160,
  productHeight: 128,
}

const defaultSubmenus: Record<string, SubmenuItem[]> = {
  support: [
    { label: '문의하기', href: '/support#inquiry', visible: true },
    { label: '개인정보처리방침', href: '/privacy', visible: true },
  ],
}

function createEmptyProduct(): Product {
  return { name: '', desc: '', image: '', link: '', visible: true }
}

function createEmptyGalleryItem(): GalleryItem {
  return { url: '', visible: true }
}

const MAX_UPLOAD_MB = 10

function parseExtra(raw?: string | null): SectionExtra {
  if (!raw) return defaultExtra
  try {
    const parsed = JSON.parse(raw) as any
    const gallery = Array.isArray(parsed.gallery)
      ? parsed.gallery.map((g: any) => {
          if (typeof g === 'string') return { url: g, visible: true }
          return { url: String(g?.url || ''), visible: g?.visible !== false }
        })
      : defaultExtra.gallery

    const products = Array.isArray(parsed.products)
      ? parsed.products.map((p: any) => ({
          name: p?.name || '',
          desc: p?.desc || '',
          image: p?.image || '',
          link: p?.link || '',
          visible: p?.visible !== false,
        }))
      : defaultExtra.products

    return { gallery, products }
  } catch {
    return defaultExtra
  }
}

export default function AdminPage() {
  const [content, setContent] = useState<Content>(initial)
  const [selectedKey, setSelectedKey] = useState('home')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [role, setRole] = useState<'admin' | 'super' | null>(null)
  const [allowedContentKeys, setAllowedContentKeys] = useState<string[]>(['*'])
  const [extra, setExtra] = useState<SectionExtra>(defaultExtra)
  const [extraSaving, setExtraSaving] = useState(false)
  const [style, setStyle] = useState<StyleConfig>(defaultStyle)
  const [styleSaving, setStyleSaving] = useState(false)
  const [submenus, setSubmenus] = useState<Record<string, SubmenuItem[]>>({})
  const [submenuSaving, setSubmenuSaving] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)

  const editableSections = useMemo(() => {
    if (allowedContentKeys.includes('*')) return sections
    return sections.filter((s) => allowedContentKeys.includes(s.key))
  }, [allowedContentKeys])

  const isHome = useMemo(() => selectedKey === 'home', [selectedKey])

  async function loadContent(key: string) {
    const res = await fetch(`/api/content?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
    const json = await res.json()

    if (!res.ok) {
      setMessage(json?.error ?? '콘텐츠를 불러올 수 없습니다.')
      return
    }

    if (json?.data) {
      setContent({
        key,
        title: json.data.title ?? '',
        subtitle: json.data.subtitle ?? '',
        body: json.data.body ?? '',
        hero_image_url: json.data.hero_image_url ?? '',
      })
    }

    const [extraRes, styleRes] = await Promise.all([
      key !== 'home'
        ? fetch(`/api/content?key=${encodeURIComponent(`${key}_extra`)}`, { cache: 'no-store' })
        : Promise.resolve(null),
      fetch(`/api/content?key=${encodeURIComponent(`${key}_style`)}`, { cache: 'no-store' }),
    ])

    if (extraRes) {
      const extraJson = await extraRes.json()
      setExtra(parseExtra(extraJson?.data?.body))
    } else {
      setExtra(defaultExtra)
    }

    if (styleRes) {
      const styleJson = await styleRes.json()
      try {
        const parsed = JSON.parse(styleJson?.data?.body || '{}')
        setStyle({
          heroHeight: Number(parsed?.heroHeight) || defaultStyle.heroHeight,
          galleryHeight: Number(parsed?.galleryHeight) || defaultStyle.galleryHeight,
          productHeight: Number(parsed?.productHeight) || defaultStyle.productHeight,
        })
      } catch {
        setStyle(defaultStyle)
      }
    }
  }



  useEffect(() => {
    ;(async () => {
      const me = await fetch('/api/admin/me', { cache: 'no-store' })
      if (me.ok) {
        const meJson = await me.json()
        setRole(meJson?.role ?? null)
        const keys = Array.isArray(meJson?.allowedContentKeys) ? meJson.allowedContentKeys : ['*']
        setAllowedContentKeys(keys)

        const firstKey = keys.includes('*')
          ? 'home'
          : (sections.find((s) => keys.includes(s.key))?.key ?? 'home')

        setSelectedKey(firstKey)
        await Promise.all([loadContent(firstKey), loadSubmenus()])
        setLoading(false)
        return
      }

      await Promise.all([loadContent('home'), loadSubmenus()])
      setLoading(false)
    })()
  }, [])


  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_auto_backup') : null
    if (saved === '0') setAutoBackup(false)
  }, [])

  async function runAutoBackupIfNeeded() {
    if (!autoBackup || role !== 'super') return true
    const res = await fetch('/api/admin/backup', { cache: 'no-store' })
    if (!res.ok) {
      setMessage('자동 백업 실패: 저장을 중단했습니다.')
      return false
    }
    return true
  }

  async function loadSubmenus() {
    const res = await fetch('/api/content?key=submenu_config', { cache: 'no-store' })
    const json = await res.json()
    try {
      const parsed = JSON.parse(json?.data?.body || '{}')
      const parsedMap = parsed && typeof parsed === 'object' ? parsed : {}
      const normalized = Object.fromEntries(
        Object.entries({ ...defaultSubmenus, ...parsedMap }).map(([key, rows]) => [
          key,
          Array.isArray(rows)
            ? rows.map((row: any) => ({
                label: String(row?.label || ''),
                href: String(row?.href || ''),
                visible: row?.visible !== false,
              }))
            : [],
        ]),
      ) as Record<string, SubmenuItem[]>
      setSubmenus(normalized)
    } catch {
      setSubmenus(defaultSubmenus)
    }
  }

  async function saveSubmenus() {
    setSubmenuSaving(true)
    if (!(await runAutoBackupIfNeeded())) { setSubmenuSaving(false); return }

    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'submenu_config',
        title: 'submenu config',
        subtitle: '',
        body: JSON.stringify(submenus),
        hero_image_url: '',
      }),
    })

    if (res.ok) setMessage('하위 메뉴 저장 완료 ✅')
    else {
      const json = await res.json()
      setMessage(`하위 메뉴 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setSubmenuSaving(false)
  }

  async function handleSave() {
    setSaving(true)
    if (!(await runAutoBackupIfNeeded())) { setSaving(false); return }
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
      setMessage('저장 완료 ✅')
    }
    setSaving(false)
  }

  async function saveExtra() {
    if (isHome) return
    setExtraSaving(true)
    if (!(await runAutoBackupIfNeeded())) { setExtraSaving(false); return }
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `${selectedKey}_extra`,
        title: `${selectedKey} extra`,
        subtitle: '',
        body: JSON.stringify(extra),
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      setMessage('갤러리/제품카드 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`갤러리/제품카드 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setExtraSaving(false)
  }

  async function saveStyle() {
    setStyleSaving(true)
    if (!(await runAutoBackupIfNeeded())) { setStyleSaving(false); return }
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `${selectedKey}_style`,
        title: `${selectedKey} style`,
        subtitle: '',
        body: JSON.stringify(style),
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      setMessage('이미지 크기 설정 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`이미지 크기 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setStyleSaving(false)
  }

  async function handleUpload(file: File, target: 'hero' | 'gallery' | 'product', index?: number) {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setMessage(`업로드 실패: 파일 용량은 ${MAX_UPLOAD_MB}MB 이하만 가능합니다.`)
      return
    }

    setUploading(true)
    setMessage('이미지 업로드 중...')
    const fd = new FormData()
    fd.append('file', file)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)

    let up: Response
    try {
      up = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      })
    } catch (e: any) {
      clearTimeout(timer)
      setUploading(false)
      setMessage(e?.name === 'AbortError' ? '업로드 시간 초과입니다. 파일 용량을 줄여 다시 시도해주세요.' : '업로드 중 네트워크 오류가 발생했습니다.')
      return
    }

    clearTimeout(timer)
    const upJson = await up.json()
    if (!up.ok) {
      setMessage(`업로드 실패: ${upJson?.error ?? 'unknown'}`)
      setUploading(false)
      return
    }

    if (target === 'hero') {
      setContent((prev) => ({ ...prev, hero_image_url: upJson.url }))
      setMessage('대표 이미지 업로드 완료. 저장 버튼을 눌러 반영하세요.')
    } else if (target === 'gallery' && typeof index === 'number') {
      setExtra((prev) => {
        const next = [...prev.gallery]
        next[index] = { ...next[index], url: upJson.url }
        return { ...prev, gallery: next }
      })
      setMessage('갤러리 이미지 업로드 완료. 갤러리/제품카드 저장 버튼을 눌러 반영하세요.')
    } else if (target === 'product' && typeof index === 'number') {
      setExtra((prev) => {
        const nextProducts = [...prev.products]
        nextProducts[index] = { ...nextProducts[index], image: upJson.url }
        return { ...prev, products: nextProducts }
      })
      setMessage('제품 이미지 업로드 완료. 갤러리/제품카드 저장 버튼을 눌러 반영하세요.')
    }

    setUploading(false)
  }

  if (loading) {
    return <main className="min-h-screen p-10">불러오는 중...</main>
  }

  return (
    <main className="min-h-screen pb-8 max-w-5xl mx-auto space-y-6">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin - 콘텐츠 관리</h1>
        <div className="flex items-center gap-2">
          <a href="/admin" className="admin-btn px-3 py-2 text-sm rounded border">콘텐츠 관리</a>
          {role === 'super' ? (
            <a href="/admin/common" className="admin-btn px-3 py-2 text-sm rounded border">
              공통 관리
            </a>
          ) : null}
          {role === 'super' ? (
            <a href="/admin/system" className="admin-btn px-3 py-2 text-sm rounded border">
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

      <div className="px-8 pt-6 space-y-6">


      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">상단 하위 메뉴 편집</h2>
        <p className="text-sm text-gray-600">각 상단 메뉴별로 하위 메뉴를 추가/수정/삭제할 수 있습니다.</p>

        <div className="space-y-4">
          {editableSections.map((section) => {
            const rows = submenus[section.key] ?? []
            return (
              <div key={section.key} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{section.label} ({section.key})</p>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs rounded border"
                    onClick={() => setSubmenus((prev) => ({
                      ...prev,
                      [section.key]: [...(prev[section.key] ?? []), { label: '', href: '', visible: true }],
                    }))}
                  >
                    + 하위 메뉴 추가
                  </button>
                </div>

                {rows.length === 0 ? <p className="text-xs text-gray-500">하위 메뉴 없음</p> : null}

                {rows.map((row, idx) => (
                  <div key={`${section.key}-${idx}`} className="grid md:grid-cols-[1fr_1.5fr_auto_auto] gap-2 items-center">
                    <input
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="메뉴명"
                      value={row.label}
                      onChange={(e) => setSubmenus((prev) => {
                        const next = [...(prev[section.key] ?? [])]
                        next[idx] = { ...next[idx], label: e.target.value }
                        return { ...prev, [section.key]: next }
                      })}
                    />
                    <input
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="링크 (예: /support#inquiry)"
                      value={row.href}
                      onChange={(e) => setSubmenus((prev) => {
                        const next = [...(prev[section.key] ?? [])]
                        next[idx] = { ...next[idx], href: e.target.value }
                        return { ...prev, [section.key]: next }
                      })}
                    />

                    <button
                      type="button"
                      className={`px-2 py-1 text-xs rounded border ${row.visible ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}
                      onClick={() => setSubmenus((prev) => {
                        const next = [...(prev[section.key] ?? [])]
                        next[idx] = { ...next[idx], visible: !next[idx].visible }
                        return { ...prev, [section.key]: next }
                      })}
                    >
                      {row.visible ? '표시' : '숨김'}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border text-red-600"
                      onClick={() => setSubmenus((prev) => ({
                        ...prev,
                        [section.key]: (prev[section.key] ?? []).filter((_, i) => i !== idx),
                      }))}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <button className="px-4 py-2 rounded border" disabled={submenuSaving} onClick={saveSubmenus}>
          {submenuSaving ? '하위 메뉴 저장 중...' : '하위 메뉴 저장'}
        </button>
      </section>

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">페이지 콘텐츠 편집</h2>
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
            {editableSections.map((section) => (
              <option key={section.key} value={section.key}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">제목</label>
          <input className="w-full border rounded px-3 py-2" value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">부제목</label>
          <input className="w-full border rounded px-3 py-2" value={content.subtitle} onChange={(e) => setContent({ ...content, subtitle: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">본문</label>
          <textarea className="w-full border rounded px-3 py-2 min-h-40" value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">대표 이미지</label>
            <label className="ml-2 inline-flex items-center gap-3 px-3 py-1.5 rounded border bg-white text-xs font-medium cursor-pointer hover:bg-slate-50">
            이미지 파일 선택
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file, 'hero')
              }}
            />
            </label>
          </div>
          <p className="text-xs text-gray-500">권장: 10MB 이하 / jpg, png, webp</p>
          {content.hero_image_url ? (
            <img src={content.hero_image_url} alt="hero" className="w-full max-h-72 object-cover rounded border" />
          ) : (
            <p className="text-sm text-gray-500">이미지 없음</p>
          )}
        </div>

        <button className="px-4 py-2 rounded border" disabled={saving || uploading} onClick={handleSave}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </section>

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">이미지 크기 조절</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="space-y-1 block">
            <span className="text-sm text-gray-600">상단 큰 이미지 높이(px)</span>
            <input type="number" className="w-full border rounded px-3 py-2" value={style.heroHeight}
              onChange={(e) => setStyle((prev) => ({ ...prev, heroHeight: Number(e.target.value) || 420 }))} />
          </label>
          <label className="space-y-1 block">
            <span className="text-sm text-gray-600">갤러리 사진 높이(px)</span>
            <input type="number" className="w-full border rounded px-3 py-2" value={style.galleryHeight}
              onChange={(e) => setStyle((prev) => ({ ...prev, galleryHeight: Number(e.target.value) || 160 }))} />
          </label>
          <label className="space-y-1 block">
            <span className="text-sm text-gray-600">제품 사진 높이(px)</span>
            <input type="number" className="w-full border rounded px-3 py-2" value={style.productHeight}
              onChange={(e) => setStyle((prev) => ({ ...prev, productHeight: Number(e.target.value) || 128 }))} />
          </label>
        </div>
        <button className="px-4 py-2 rounded border" disabled={styleSaving} onClick={saveStyle}>
          {styleSaving ? '크기 저장 중...' : '이미지 크기 저장'}
        </button>
      </section>

      {!isHome ? (
        <section className="border rounded-xl p-5 space-y-6">
          <h2 className="text-lg font-semibold">갤러리 / 제품 카드 편집 ({selectedKey})</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">갤러리 이미지 ({extra.gallery.length}개)</h3>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded border"
                onClick={() => setExtra((prev) => ({ ...prev, gallery: [...prev.gallery, createEmptyGalleryItem()] }))}
              >
                + 갤러리 추가
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {extra.gallery.length === 0 ? (
                <p className="text-sm text-gray-500 md:col-span-3">갤러리 항목이 없습니다. + 갤러리 추가 버튼으로 생성해주세요.</p>
              ) : null}
              {extra.gallery.map((url, i) => (
                <div key={i} className="space-y-2 border rounded p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">갤러리 {i + 1}</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border"
                        disabled={i === 0}
                        onClick={() => {
                          setExtra((prev) => {
                            if (i === 0) return prev
                            const next = [...prev.gallery]
                            ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                            return { ...prev, gallery: next }
                          })
                        }}
                      >↑</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border"
                        disabled={i === extra.gallery.length - 1}
                        onClick={() => {
                          setExtra((prev) => {
                            if (i >= prev.gallery.length - 1) return prev
                            const next = [...prev.gallery]
                            ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                            return { ...prev, gallery: next }
                          })
                        }}
                      >↓</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border"
                        onClick={() => {
                          setExtra((prev) => {
                            const next = [...prev.gallery]
                            next[i] = { ...next[i], visible: !next[i].visible }
                            return { ...prev, gallery: next }
                          })
                        }}
                      >{url.visible ? '숨김' : '표시'}</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border text-red-600"
                        onClick={() => {
                          setExtra((prev) => ({
                            ...prev,
                            gallery: prev.gallery.filter((_, idx) => idx !== i),
                          }))
                        }}
                      >삭제</button>
                    </div>
                  </div>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder={`갤러리 이미지 ${i + 1} URL`}
                    value={url.url}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtra((prev) => {
                        const next = [...prev.gallery]
                        next[i] = { ...next[i], url: val }
                        return { ...prev, gallery: next }
                      })
                    }}
                  />
                  <label className="inline-flex items-center gap-3 px-2.5 py-1.5 rounded border bg-white text-[11px] font-medium cursor-pointer hover:bg-slate-50">
                    갤러리 이미지 선택
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file, 'gallery', i)
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">제품 카드 ({extra.products.length}개)</h3>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded border"
                onClick={() => setExtra((prev) => ({ ...prev, products: [...prev.products, createEmptyProduct()] }))}
              >
                + 제품 카드 추가
              </button>
            </div>
            <div className="space-y-4">
              {extra.products.length === 0 ? (
                <p className="text-sm text-gray-500">제품 카드가 없습니다. + 제품 카드 추가 버튼으로 생성해주세요.</p>
              ) : null}
              {extra.products.map((product, i) => (
                <div key={i} className="border rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">제품 {i + 1}</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border"
                        disabled={i === 0}
                        onClick={() => {
                          setExtra((prev) => {
                            if (i === 0) return prev
                            const next = [...prev.products]
                            ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                            return { ...prev, products: next }
                          })
                        }}
                      >↑</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border"
                        disabled={i === extra.products.length - 1}
                        onClick={() => {
                          setExtra((prev) => {
                            if (i >= prev.products.length - 1) return prev
                            const next = [...prev.products]
                            ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                            return { ...prev, products: next }
                          })
                        }}
                      >↓</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border"
                        onClick={() => {
                          setExtra((prev) => {
                            const next = [...prev.products]
                            next[i] = { ...next[i], visible: !next[i].visible }
                            return { ...prev, products: next }
                          })
                        }}
                      >{product.visible ? '숨김' : '표시'}</button>
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border text-red-600"
                        onClick={() => {
                          setExtra((prev) => ({
                            ...prev,
                            products: prev.products.filter((_, idx) => idx !== i),
                          }))
                        }}
                      >삭제</button>
                    </div>
                  </div>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="제품명"
                    value={product.name}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtra((prev) => {
                        const next = [...prev.products]
                        next[i] = { ...next[i], name: val }
                        return { ...prev, products: next }
                      })
                    }}
                  />
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="제품 이미지 URL"
                    value={product.image}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtra((prev) => {
                        const next = [...prev.products]
                        next[i] = { ...next[i], image: val }
                        return { ...prev, products: next }
                      })
                    }}
                  />
                  <label className="inline-flex items-center gap-3 px-2.5 py-1.5 rounded border bg-white text-[11px] font-medium cursor-pointer hover:bg-slate-50">
                    제품 이미지 선택
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file, 'product', i)
                      }}
                    />
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm min-h-20"
                    placeholder="제품 설명"
                    value={product.desc}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtra((prev) => {
                        const next = [...prev.products]
                        next[i] = { ...next[i], desc: val }
                        return { ...prev, products: next }
                      })
                    }}
                  />
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="문의하기 버튼 링크 (선택)"
                    value={product.link}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtra((prev) => {
                        const next = [...prev.products]
                        next[i] = { ...next[i], link: val }
                        return { ...prev, products: next }
                      })
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button className="px-4 py-2 rounded border" disabled={extraSaving || uploading} onClick={saveExtra}>
            {extraSaving ? '갤러리/제품카드 저장 중...' : '갤러리/제품카드 저장'}
          </button>
        </section>
      ) : null}

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
      </div>
    </main>
  )
}
