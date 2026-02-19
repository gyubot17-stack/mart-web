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

function createEmptyProduct(): Product {
  return { name: '', desc: '', image: '', link: '', visible: true }
}

function createEmptyGalleryItem(): GalleryItem {
  return { url: '', visible: true }
}

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
        await loadContent(firstKey)
        setLoading(false)
        return
      }

      await loadContent('home')
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
    <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin - 콘텐츠 관리</h1>
        <div className="flex items-center gap-2">
          <a href="/admin" className="admin-btn px-3 py-2 text-sm rounded border">홈</a>
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


      <section className="border rounded-xl p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoBackup}
            onChange={(e) => {
              setAutoBackup(e.target.checked)
              if (typeof window !== 'undefined') localStorage.setItem('admin_auto_backup', e.target.checked ? '1' : '0')
            }}
          />
          저장 전에 자동 백업하기 (슈퍼관리자만)
        </label>
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
          <label className="text-sm font-medium">대표 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file, 'hero')
            }}
          />
          {content.hero_image_url ? (
            <img src={content.hero_image_url} alt="hero" className="w-full max-h-72 object-cover rounded border" />
          ) : (
            <p className="text-sm text-gray-500">이미지 없음</p>
          )}
        </div>

        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={saving || uploading} onClick={handleSave}>
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, 'gallery', i)
                    }}
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, 'product', i)
                    }}
                  />
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
    </main>
  )
}
