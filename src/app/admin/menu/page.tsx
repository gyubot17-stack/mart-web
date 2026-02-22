'use client'

import { useEffect, useMemo, useState } from 'react'

type SubmenuItem = {
  label: string
  href: string
  visible: boolean
}

const sections = [
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

const defaultSubmenus: Record<string, SubmenuItem[]> = {
  support: [
    { label: '문의하기', href: '/support#inquiry', visible: true },
    { label: '개인정보처리방침', href: '/privacy', visible: true },
  ],
}

function getLinkType(href: string) {
  const clean = String(href || '').trim()
  if (!clean.startsWith('/')) return { ok: false, label: '링크 형식 오류' }
  if (clean.includes('#')) return { ok: false, label: '앵커 링크' }
  const path = clean.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!path || path.includes('/')) return { ok: false, label: '다단 경로' }
  return { ok: true, label: '페이지 편집 가능' }
}

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [menuSaving, setMenuSaving] = useState(false)
  const [submenuSaving, setSubmenuSaving] = useState(false)
  const [menuLabels, setMenuLabels] = useState<Record<string, string>>({})
  const [menuVisibility, setMenuVisibility] = useState<Record<string, boolean>>({})
  const [submenus, setSubmenus] = useState<Record<string, SubmenuItem[]>>({})
  const [role, setRole] = useState<'admin' | 'super' | null>(null)
  const [allowedContentKeys, setAllowedContentKeys] = useState<string[]>(['*'])

  const editableSections = useMemo(() => {
    if (allowedContentKeys.includes('*')) return sections
    return sections.filter((s) => allowedContentKeys.includes(s.key))
  }, [allowedContentKeys])

  useEffect(() => {
    ;(async () => {
      const me = await fetch('/api/admin/me', { cache: 'no-store' })
      if (me.ok) {
        const meJson = await me.json()
        setRole(meJson?.role ?? null)
        const keys = Array.isArray(meJson?.allowedContentKeys) ? meJson.allowedContentKeys : ['*']
        setAllowedContentKeys(keys)
      }

      const [menuRes, visibilityRes, submenuRes] = await Promise.all([
        fetch('/api/content?key=menu_config', { cache: 'no-store' }),
        fetch('/api/content?key=menu_visibility', { cache: 'no-store' }),
        fetch('/api/content?key=submenu_config', { cache: 'no-store' }),
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

      setLoading(false)
    })()
  }, [])

  async function saveMenuLabels() {
    setMenuSaving(true)
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'menu_config',
        title: 'menu config',
        subtitle: '',
        body: JSON.stringify(menuLabels),
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      const visRes = await fetch('/api/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'menu_visibility',
          title: 'menu visibility',
          subtitle: '',
          body: JSON.stringify(menuVisibility),
          hero_image_url: '',
        }),
      })
      if (visRes.ok) setMessage('메뉴명/표시상태 저장 완료 ✅')
      else setMessage('메뉴명 저장은 완료됐지만 표시상태 저장에 실패했습니다.')
    } else {
      const json = await res.json()
      setMessage(`메뉴명 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setMenuSaving(false)
  }

  async function saveSubmenus() {
    setSubmenuSaving(true)
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

  if (loading) return <main className="min-h-screen p-8">불러오는 중...</main>

  return (
    <main className="min-h-screen pb-8 max-w-5xl mx-auto space-y-6">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin - 메뉴관리</h1>
        <div className="flex items-center gap-2">
          <a href="/admin" className="admin-btn px-3 py-2 text-sm rounded border">콘텐츠 관리</a>
          <a href="/admin/menu" className="admin-btn px-3 py-2 text-sm rounded border">메뉴관리</a>
          {role === 'super' ? <a href="/admin/common" className="admin-btn px-3 py-2 text-sm rounded border">공통 관리</a> : null}
          {role === 'super' ? <a href="/admin/system" className="admin-btn px-3 py-2 text-sm rounded border">시스템/계정 관리</a> : null}
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
          <h2 className="text-lg font-semibold">사이트형 미리보기 편집</h2>
          <p className="text-sm text-gray-600">실제 사이트 상단 구조와 동일하게 보입니다. 항목 확인 후 아래 상위/하위 편집 영역에서 바로 수정하세요.</p>

          <div className="border rounded-lg p-3 bg-white space-y-2">
            {(() => {
              const visibleSections = sections.filter((sec) => menuVisibility[sec.key] !== false)
              return (
                <>
                  <div
                    className="grid gap-x-2 pb-1"
                    style={{ gridTemplateColumns: `repeat(${Math.max(visibleSections.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {visibleSections.map((sec, idx) => (
                      <div key={`preview-top-${sec.key}`} className="min-w-0 relative flex items-center justify-center">
                        <span className="h-10 inline-flex items-center justify-center text-sm font-semibold text-slate-800">{menuLabels[sec.key] ?? sec.label}</span>
                        {idx < visibleSections.length - 1 ? <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300">|</span> : null}
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid gap-x-2 gap-y-2 pt-2"
                    style={{ gridTemplateColumns: `repeat(${Math.max(visibleSections.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {visibleSections.map((sec) => {
                      const rows = (submenus[sec.key] || []).filter((row) => row.visible !== false)
                      return (
                        <div key={`preview-sub-${sec.key}`} className="space-y-1 min-w-0">
                          <div className="flex flex-col items-start gap-1">
                            {rows.length === 0 ? (
                              <span className="px-1 py-0.5 text-xs text-slate-400">하위메뉴 없음</span>
                            ) : rows.map((row, idx) => (
                              <div key={`preview-row-${sec.key}-${idx}`} className="flex items-center">
                                <span className="px-1 py-0.5 text-sm text-slate-700">{row.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            <div className="flex items-center gap-2 pt-2">
              <a href="#parent-editor" className="px-3 py-1.5 text-xs rounded border">상위메뉴 편집으로 이동</a>
              <a href="#submenu-editor" className="px-3 py-1.5 text-xs rounded border">하위메뉴 편집으로 이동</a>
            </div>
          </div>
        </section>

        <section id="parent-editor" className="border rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">상위메뉴 편집</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {sections.map((section) => {
              const visible = menuVisibility[section.key] !== false
              return (
              <div key={section.key} className="space-y-1 block border rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{section.key}</span>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs rounded border ${visible ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}
                    onClick={() => setMenuVisibility((prev) => ({ ...prev, [section.key]: !visible }))}
                  >
                    {visible ? '표시' : '숨김'}
                  </button>
                </div>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={menuLabels[section.key] ?? section.label}
                  onChange={(e) => setMenuLabels((prev) => ({ ...prev, [section.key]: e.target.value }))}
                />
              </div>
            )})}
          </div>
          <div className="flex justify-end"><button className="px-4 py-2 rounded border" disabled={menuSaving} onClick={saveMenuLabels}>
            {menuSaving ? '메뉴 저장 중...' : '메뉴명 저장'}
          </button></div>
        </section>

        <section id="submenu-editor" className="border rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">하위메뉴 편집</h2>
          <p className="text-sm text-gray-600">각 상단 메뉴별로 하위 메뉴를 추가/수정/삭제할 수 있습니다. 링크 형식에 따라 편집 가능 여부를 배지로 안내합니다.</p>

          <div className="space-y-4">
            {editableSections.map((section) => {
              const rows = submenus[section.key] ?? []
              const parentVisible = menuVisibility[section.key] !== false
              return (
                <div key={section.key} className={`border rounded p-3 space-y-2 ${parentVisible ? '' : 'bg-slate-50 opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{section.label} ({section.key}) {!parentVisible ? <span className="ml-2 text-xs text-slate-500">(상위 메뉴 숨김 상태)</span> : null}</p>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border"
                      disabled={!parentVisible}
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
                    <div key={`${section.key}-${idx}`} className="grid md:grid-cols-[1fr_1.5fr_auto_auto_auto] gap-2 items-center">
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="메뉴명"
                        disabled={!parentVisible}
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
                        disabled={!parentVisible}
                        value={row.href}
                        onChange={(e) => setSubmenus((prev) => {
                          const next = [...(prev[section.key] ?? [])]
                          next[idx] = { ...next[idx], href: e.target.value }
                          return { ...prev, [section.key]: next }
                        })}
                      />

                      <button
                        type="button"
                        disabled={!parentVisible}
                        className={`px-2 py-1 text-xs rounded border ${row.visible ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}
                        onClick={() => setSubmenus((prev) => {
                          const next = [...(prev[section.key] ?? [])]
                          next[idx] = { ...next[idx], visible: !next[idx].visible }
                          return { ...prev, [section.key]: next }
                        })}
                      >
                        {row.visible ? '표시' : '숨김'}
                      </button>
                      {(() => {
                        const href = String(row.href || '').trim()
                        const canEdit = href.startsWith('/') && !href.includes('#') && href.split('/').filter(Boolean).length === 1
                        const editKey = canEdit ? href.replace(/^\//, '') : ''
                        return (
                          <a
                            href={canEdit && parentVisible ? `/admin?key=${encodeURIComponent(editKey)}` : '#'}
                            className={`px-2 py-1 text-xs rounded border text-center whitespace-nowrap ${canEdit && parentVisible ? 'text-blue-700 border-blue-300 bg-blue-50' : 'text-slate-400 border-slate-200 bg-slate-50 pointer-events-none'}`}
                            title={canEdit ? '이 하위메뉴 페이지 내용 편집' : '단일 경로(/notice 형태)일 때만 편집 가능'}
                          >
                            내용편집
                          </a>
                        )
                      })()}
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded border text-red-600"
                        disabled={!parentVisible}
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

          <div className="flex justify-end"><button className="px-4 py-2 rounded border" disabled={submenuSaving} onClick={saveSubmenus}>
            {submenuSaving ? '하위 메뉴 저장 중...' : '하위 메뉴 저장'}
          </button></div>
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
