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

type MapConfig = {
  address: string
  embedUrl: string
  naverUrl?: string
  kakaoUrl?: string
  googleUrl?: string
}

type Inquiry = {
  key: string
  name: string
  phone: string
  message: string
  note?: string
  createdAt: string | null
  status: 'new' | 'done'
}

type EditorSubmenuItem = {
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

const defaultMapConfig: MapConfig = {
  address: '경남 함안군 법수면 법정로 114',
  embedUrl: '',
  naverUrl: '',
  kakaoUrl: '',
  googleUrl: '',
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
  const [mapConfig, setMapConfig] = useState<MapConfig>(defaultMapConfig)
  const [mapSaving, setMapSaving] = useState(false)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [inquiryQuery, setInquiryQuery] = useState('')
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'new' | 'done'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [inquiryNote, setInquiryNote] = useState('')
  const [autoBackup, setAutoBackup] = useState(true)
  const [menuLabels, setMenuLabels] = useState<Record<string, string>>({})
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({})
  const [submenus, setSubmenus] = useState<Record<string, EditorSubmenuItem[]>>({})
  const [pageTypes, setPageTypes] = useState<Record<string, string>>({})
  const [typeSaving, setTypeSaving] = useState(false)

  const editableSections = useMemo(() => {
    if (allowedContentKeys.includes('*')) return sections
    return sections.filter((s) => allowedContentKeys.includes(s.key))
  }, [allowedContentKeys])

  const visibleSections = useMemo(() => editableSections.filter((s) => menuVisibility[s.key] !== false), [editableSections, menuVisibility])

  const isHome = useMemo(() => selectedKey === 'home', [selectedKey])
  const isCustomPage = useMemo(() => !sections.some((sec) => sec.key === selectedKey), [selectedKey])

  const currentPageType = useMemo(() => {
    const configured = pageTypes[selectedKey]
    if (configured) return configured
    if (selectedKey === 'map') return 'map'
    if (selectedKey === 'support') return 'inquiry'
    return 'general'
  }, [pageTypes, selectedKey])


  const showHeroImageEditor = useMemo(() => !isHome && currentPageType !== 'map', [isHome, currentPageType])
  const showStyleEditor = useMemo(() => ['general', 'gallery', 'custom'].includes(currentPageType), [currentPageType])
  const showExtraEditor = useMemo(() => ['general', 'gallery', 'custom'].includes(currentPageType), [currentPageType])

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((q) => {
      const byStatus = inquiryStatusFilter === 'all' ? true : q.status === inquiryStatusFilter
      const needle = inquiryQuery.trim().toLowerCase()
      const byText = !needle || q.name.toLowerCase().includes(needle) || q.phone.toLowerCase().includes(needle) || q.message.toLowerCase().includes(needle)
      return byStatus && byText
    })
  }, [inquiries, inquiryQuery, inquiryStatusFilter])

  function normalizeKeyFromHref(href: string) {
    const clean = String(href || '').trim()
    if (!clean.startsWith('/')) return ''
    const withoutHash = clean.split('#')[0]
    const path = withoutHash.replace(/^\/+/, '').replace(/\/+$/, '')
    if (!path || path.includes('/')) return ''
    return path
  }

  async function openEditorKey(key: string) {
    const target = key.trim().replace(/^\/+/, '').replace(/\/+$/, '')
    if (!target || target.includes('/')) return
    setSelectedKey(target)
    setLoading(true)
    await loadContent(target)
    setMessage('')
    setLoading(false)
  }

  async function loadEditorMenu() {
    const [menuRes, visibilityRes, submenuRes, pageTypeRes] = await Promise.all([
      fetch('/api/content?key=menu_config', { cache: 'no-store' }),
      fetch('/api/content?key=menu_visibility', { cache: 'no-store' }),
      fetch('/api/content?key=submenu_config', { cache: 'no-store' }),
      fetch('/api/content?key=page_type_config', { cache: 'no-store' }),
    ])

    const menuJson = await menuRes.json()
    try {
      const parsed = JSON.parse(menuJson?.data?.body || '{}')
      setMenuLabels(parsed && typeof parsed === 'object' ? parsed : {})
    } catch {
      setMenuLabels({})
    }

    const visibilityJson = await visibilityRes.json()
    try {
      const parsed = JSON.parse(visibilityJson?.data?.body || '{}')
      setMenuVisibility(parsed && typeof parsed === 'object' ? parsed : {})
    } catch {
      setMenuVisibility({})
    }

    const submenuJson = await submenuRes.json()
    try {
      const parsed = JSON.parse(submenuJson?.data?.body || '{}')
      const mapped = parsed && typeof parsed === 'object' ? parsed : {}
      const normalized = Object.fromEntries(
        Object.entries(mapped).map(([key, rows]) => [
          key,
          Array.isArray(rows)
            ? rows.map((row: any) => ({
                label: String(row?.label || ''),
                href: String(row?.href || ''),
                visible: row?.visible !== false,
              }))
            : [],
        ]),
      ) as Record<string, EditorSubmenuItem[]>
      setSubmenus(normalized)
    } catch {
      setSubmenus({})
    }

    const pageTypeJson = await pageTypeRes.json()
    try {
      const parsed = JSON.parse(pageTypeJson?.data?.body || '{}')
      setPageTypes(parsed && typeof parsed === 'object' ? parsed : {})
    } catch {
      setPageTypes({})
    }

  }

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

    const [extraRes, styleRes, mapRes] = await Promise.all([
      fetch(`/api/content?key=${encodeURIComponent(`${key}_extra`)}`, { cache: 'no-store' }),
      fetch(`/api/content?key=${encodeURIComponent(`${key}_style`)}`, { cache: 'no-store' }),
      fetch('/api/content?key=map_config', { cache: 'no-store' }),
    ])

    const extraJson = await extraRes.json()
    setExtra(parseExtra(extraJson?.data?.body))

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
    const mapJson = await mapRes.json()
    try {
      const parsed = JSON.parse(mapJson?.data?.body || '{}')
      setMapConfig({
        address: typeof parsed?.address === 'string' ? parsed.address : defaultMapConfig.address,
        embedUrl: typeof parsed?.embedUrl === 'string' ? parsed.embedUrl : '',
        naverUrl: typeof parsed?.naverUrl === 'string' ? parsed.naverUrl : '',
        kakaoUrl: typeof parsed?.kakaoUrl === 'string' ? parsed.kakaoUrl : '',
        googleUrl: typeof parsed?.googleUrl === 'string' ? parsed.googleUrl : '',
      })
    } catch {
      setMapConfig(defaultMapConfig)
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

        const urlKey = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('key') : null
        const requestedKey = (urlKey || '').trim().replace(/^\/+/, '').replace(/\/+$/, '')
        const canUseRequested = !!requestedKey && !requestedKey.includes('/')

        const firstKey = canUseRequested
          ? requestedKey
          : (keys.includes('*')
              ? 'home'
              : (sections.find((s) => keys.includes(s.key))?.key ?? 'home'))

        setSelectedKey(firstKey)
        await Promise.all([loadContent(firstKey), loadEditorMenu()])
        setLoading(false)
        return
      }

      const urlKey = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('key') : null
      const requestedKey = (urlKey || '').trim().replace(/^\/+/, '').replace(/\/+$/, '')
      const firstKey = requestedKey && !requestedKey.includes('/') ? requestedKey : 'home'
      setSelectedKey(firstKey)
      await Promise.all([loadContent(firstKey), loadEditorMenu()])
      setLoading(false)
    })()
  }, [])


  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_auto_backup') : null
    if (saved === '0') setAutoBackup(false)
  }, [])

  useEffect(() => {
    if (currentPageType === 'inquiry') refreshInquiries()
  }, [currentPageType])

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



  async function savePageType() {
    setTypeSaving(true)
    if (!(await runAutoBackupIfNeeded())) { setTypeSaving(false); return }
    const next = { ...pageTypes, [selectedKey]: currentPageType }
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'page_type_config',
        title: 'page type config',
        subtitle: '',
        body: JSON.stringify(next),
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      setPageTypes(next)
      setMessage('페이지 타입 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`페이지 타입 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setTypeSaving(false)
  }

  async function saveMapConfig() {
    setMapSaving(true)
    if (!(await runAutoBackupIfNeeded())) { setMapSaving(false); return }
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'map_config',
        title: 'map config',
        subtitle: '',
        body: JSON.stringify(mapConfig),
        hero_image_url: '',
      }),
    })

    if (res.ok) setMessage('지도/주소 설정 저장 완료 ✅')
    else {
      const json = await res.json()
      setMessage(`지도/주소 설정 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setMapSaving(false)
  }


  async function refreshInquiries() {
    const res = await fetch('/api/admin/inquiries', { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) setInquiries(json?.inquiries ?? [])
  }

  async function toggleInquiryStatus(key: string, status: 'new' | 'done') {
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, status }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(`문의 상태 변경 실패: ${json?.error ?? 'unknown'}`)
      return
    }
    setMessage('문의 상태 변경 완료 ✅')
    await refreshInquiries()
  }

  async function saveInquiryNote(key: string) {
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, status: '', note: inquiryNote }),
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(`문의 메모 저장 실패: ${json?.error ?? 'unknown'}`)
      return
    }
    setMessage('문의 메모 저장 완료 ✅')
    await refreshInquiries()
  }

  async function deleteInquiry(key: string) {
    if (!confirm('이 문의를 삭제할까요?')) return
    const res = await fetch(`/api/admin/inquiries?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setMessage(`문의 삭제 실패: ${json?.error ?? 'unknown'}`)
      return
    }
    setMessage('문의 삭제 완료 ✅')
    await refreshInquiries()
  }

  function downloadInquiryCsv() {
    const headers = ['key', 'status', 'name', 'phone', 'message', 'createdAt']
    const escape = (v: string) => `"${String(v ?? '').replaceAll('"', '""')}"`
    const rows = filteredInquiries.map((q) => [q.key, q.status, q.name, q.phone, q.message, q.createdAt ?? ''].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inquiries-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
            <a href="/admin/menu" className="admin-btn px-3 py-2 text-sm rounded border">
              메뉴관리
            </a>
          ) : null}
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
        <h2 className="text-lg font-semibold">페이지 콘텐츠 편집</h2>
        <div className="space-y-3">
          <label className="text-sm font-medium">편집할 페이지 (사이트 메뉴 구조)</label>
          <div className="border rounded-lg p-3 bg-white">
            <div
              className="grid gap-x-2 gap-y-3"
              style={{ gridTemplateColumns: `repeat(${Math.max(visibleSections.length, 1)}, minmax(0, 1fr))` }}
            >
              {visibleSections.map((section) => {
                const label = menuLabels[section.key]?.trim() || section.label
                const children = (submenus[section.key] || []).filter((row) => row.visible !== false)
                return (
                  <div key={section.key} className="px-1 relative">
                    <button
                      type="button"
                      className={`h-12 w-full text-sm ${selectedKey === section.key ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} hover:bg-slate-50`}
                      onClick={() => openEditorKey(section.key)}
                    >
                      {label}
                    </button>
                    {visibleSections.findIndex((x) => x.key === section.key) < visibleSections.length - 1 ? <span className="absolute right-0 top-[11px] text-slate-300">|</span> : null}

                    <div className="pt-1 min-h-[34px] flex flex-col items-stretch gap-1">
                      {children.map((child, idx) => {
                        const targetKey = normalizeKeyFromHref(child.href)
                        const isDisabled = !targetKey
                        return (
                          <button
                            key={`${section.key}-${idx}-${child.href}`}
                            type="button"
                            disabled={isDisabled}
                            className={`w-full px-1 py-1 text-sm border-0 rounded-none text-left ${selectedKey === targetKey ? 'font-bold text-slate-900 bg-slate-50' : 'font-medium text-slate-700 bg-white'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                            onClick={() => !isDisabled && openEditorKey(targetKey)}
                            title={isDisabled ? '단일 페이지 링크만 편집 가능합니다' : child.href}
                          >
                            {child.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-3 space-y-2">
          <label className="text-sm font-medium">페이지 타입</label>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="border rounded px-3 py-2 text-sm"
              value={currentPageType}
              onChange={(e) => setPageTypes((prev) => ({ ...prev, [selectedKey]: e.target.value }))}
            >
              <option value="general">일반형 (소개/제품)</option>
              <option value="inquiry">문의형 (문의하기 중심)</option>
              <option value="map">지도형 (찾아오시는 길)</option>
              <option value="gallery">갤러리형</option>
              <option value="news">공지/소식형</option>
              <option value="custom">커스텀</option>
            </select>
            <button className="px-3 py-2 rounded border text-sm" disabled={typeSaving} onClick={savePageType}>
              {typeSaving ? '타입 저장 중...' : '페이지 타입 저장'}
            </button>
          </div>
          <p className="text-xs text-gray-500">페이지별 목적을 타입으로 저장해두면 이후 커스텀 편집 UI를 더 쉽게 자동 분기할 수 있습니다.</p>

          {currentPageType === 'map' ? (
            <div className="rounded border border-blue-200 bg-blue-50 p-3 space-y-2 text-sm text-blue-900">
              <p className="font-medium">지도형 페이지 설정</p>
              <input
                className="w-full border rounded px-3 py-2 bg-white text-slate-800"
                placeholder="기본 주소"
                value={mapConfig.address}
                onChange={(e) => setMapConfig((prev) => ({ ...prev, address: e.target.value }))}
              />
              <textarea
                className="w-full border rounded px-3 py-2 min-h-24 bg-white text-slate-800"
                placeholder="네이버지도 iframe src URL"
                value={mapConfig.embedUrl}
                onChange={(e) => setMapConfig((prev) => ({ ...prev, embedUrl: e.target.value }))}
              />
              <input className="w-full border rounded px-3 py-2 bg-white text-slate-800" placeholder="네이버지도 링크(선택, 버튼용)" value={mapConfig.naverUrl || ''} onChange={(e)=>setMapConfig((prev)=>({ ...prev, naverUrl: e.target.value }))} />
              <input className="w-full border rounded px-3 py-2 bg-white text-slate-800" placeholder="카카오맵 링크(선택, 버튼용)" value={mapConfig.kakaoUrl || ''} onChange={(e)=>setMapConfig((prev)=>({ ...prev, kakaoUrl: e.target.value }))} />
              <input className="w-full border rounded px-3 py-2 bg-white text-slate-800" placeholder="구글맵 링크(선택, 버튼용)" value={mapConfig.googleUrl || ''} onChange={(e)=>setMapConfig((prev)=>({ ...prev, googleUrl: e.target.value }))} />
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded border bg-white text-sm" disabled={mapSaving} onClick={saveMapConfig}>
                  {mapSaving ? '지도 설정 저장 중...' : '지도 설정 저장'}
                </button>
                <a href="/map" target="_blank" className="px-3 py-2 rounded border bg-white text-sm">/map 미리보기</a>
              </div>
              <p className="text-xs text-blue-800">네이버지도 공유 &gt; 퍼가기에서 iframe src만 붙여넣으세요.</p>
            </div>
          ) : null}

          {currentPageType === 'inquiry' ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              문의형 페이지입니다. 본문/CTA 문구 위주로 관리하는 것을 권장합니다.
            </div>
          ) : null}
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
          <label className="text-sm font-medium">본문 (기본입력)</label>
          <textarea className="w-full border rounded px-3 py-2 min-h-40" value={content.body} onChange={(e) => setContent({ ...content, body: e.target.value })} />
        </div>

        {showHeroImageEditor ? (

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
        ) : null}

        <button className="px-4 py-2 rounded border" disabled={saving || uploading} onClick={handleSave}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </section>

{showStyleEditor ? (
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
      ) : null}

      {showExtraEditor ? (
      <section className="border rounded-xl p-5 space-y-6">
          <h2 className="text-lg font-semibold">{isHome ? '메인 슬라이드 이미지 편집 (home)' : `갤러리 / 제품 카드 편집 (${selectedKey})`}</h2>
          {isHome ? <p className="text-sm text-gray-600">갤러리 이미지를 2장 이상 넣으면 홈 메인 이미지가 자동으로 슬라이드됩니다.</p> : null}

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

          {showHeroImageEditor ? (
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
          ) : null}

          <button className="px-4 py-2 rounded border" disabled={extraSaving || uploading} onClick={saveExtra}>
            {extraSaving ? (isHome ? '메인 슬라이드 저장 중...' : '갤러리/제품카드 저장 중...') : (isHome ? '메인 슬라이드 저장' : '갤러리/제품카드 저장')}
          </button>
        </section>
      ) : null}


      {currentPageType === 'inquiry' ? (
      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">고객 문의 관리</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input className="border rounded px-3 py-2 text-sm min-w-56" placeholder="이름/연락처/내용 검색" value={inquiryQuery} onChange={(e) => setInquiryQuery(e.target.value)} />
          <select className="border rounded px-3 py-2 text-sm" value={inquiryStatusFilter} onChange={(e) => setInquiryStatusFilter(e.target.value as 'all' | 'new' | 'done')}>
            <option value="all">전체</option><option value="new">신규</option><option value="done">처리완료</option>
          </select>
          <button className="px-3 py-2 text-sm rounded border" onClick={downloadInquiryCsv}>CSV 다운로드</button>
          <button className="px-3 py-2 text-sm rounded border" onClick={refreshInquiries}>새로고침</button>
        </div>
        <div className="space-y-3">
          {filteredInquiries.length === 0 ? <p className="text-sm text-gray-500">조건에 맞는 문의가 없습니다.</p> : filteredInquiries.map((q) => (
            <div key={q.key} className="border rounded p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{q.name} / {q.phone}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${q.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{q.status === 'done' ? '처리완료' : '신규'}</span>
                  <button className="px-2 py-1 text-xs rounded border" onClick={() => toggleInquiryStatus(q.key, q.status === 'done' ? 'new' : 'done')}>{q.status === 'done' ? '신규로 변경' : '완료로 변경'}</button>
                  <button className="px-2 py-1 text-xs rounded border" onClick={() => { setSelectedInquiry(q); setInquiryNote(q.note || '') }}>상세</button>
                  <button className="px-2 py-1 text-xs rounded border text-red-600" onClick={() => deleteInquiry(q.key)}>삭제</button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.message}</p>
            </div>
          ))}
        </div>
        {selectedInquiry ? (
          <div className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between"><p className="font-medium">문의 상세</p><button className="px-2 py-1 text-xs rounded border" onClick={() => setSelectedInquiry(null)}>닫기</button></div>
            <p className="text-sm"><b>이름:</b> {selectedInquiry.name}</p>
            <p className="text-sm"><b>연락처:</b> {selectedInquiry.phone}</p>
            <p className="text-sm whitespace-pre-wrap"><b>문의내용:</b> {selectedInquiry.message}</p>
            <textarea className="w-full border rounded p-3 min-h-24" placeholder="관리자 메모" value={inquiryNote} onChange={(e)=>setInquiryNote(e.target.value)} />
            <button className="px-4 py-2 rounded border" onClick={() => saveInquiryNote(selectedInquiry.key)}>메모 저장</button>
          </div>
        ) : null}
      </section>
      ) : null}

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
