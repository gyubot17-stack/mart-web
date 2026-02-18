'use client'

import { useEffect, useState } from 'react'

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

type FooterConfig = {
  companyName: string
  companyInfo: string
  addressInfo: string
}

const defaultFooter: FooterConfig = {
  companyName: 'mrtc.kr',
  companyInfo: '대표: (입력 예정) | 사업자번호: (입력 예정)',
  addressInfo: '주소: (입력 예정) | 연락처: (입력 예정)',
}

export default function AdminCommonPage() {
  const [loading, setLoading] = useState(true)
  const [menuLabels, setMenuLabels] = useState<Record<string, string>>({})
  const [footer, setFooter] = useState<FooterConfig>(defaultFooter)
  const [menuSaving, setMenuSaving] = useState(false)
  const [footerSaving, setFooterSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    ;(async () => {
      const [menuRes, footerRes] = await Promise.all([
        fetch('/api/content?key=menu_config', { cache: 'no-store' }),
        fetch('/api/content?key=footer_config', { cache: 'no-store' }),
      ])

      const menuJson = await menuRes.json()
      try {
        const parsed = JSON.parse(menuJson?.data?.body || '{}')
        setMenuLabels(parsed && typeof parsed === 'object' ? parsed : {})
      } catch {
        setMenuLabels({})
      }

      const footerJson = await footerRes.json()
      try {
        const parsed = JSON.parse(footerJson?.data?.body || '{}')
        setFooter({
          companyName: parsed?.companyName || defaultFooter.companyName,
          companyInfo: parsed?.companyInfo || defaultFooter.companyInfo,
          addressInfo: parsed?.addressInfo || defaultFooter.addressInfo,
        })
      } catch {
        setFooter(defaultFooter)
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
      setMessage('메뉴명 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`메뉴명 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setMenuSaving(false)
  }

  async function saveFooter() {
    setFooterSaving(true)
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'footer_config',
        title: 'footer config',
        subtitle: '',
        body: JSON.stringify(footer),
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      setMessage('푸터 정보 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`푸터 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setFooterSaving(false)
  }

  if (loading) return <main className="min-h-screen p-8">불러오는 중...</main>

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin - 공통 관리</h1>
        <div className="flex items-center gap-2">
          <a href="/" className="admin-btn px-3 py-2 text-sm rounded border">홈</a>
          <a href="/admin" className="admin-btn px-3 py-2 text-sm rounded border">콘텐츠 관리</a>
          <a href="/admin/system" className="admin-btn px-3 py-2 text-sm rounded border">시스템/계정 관리</a>
        </div>
      </div>

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">상단 메뉴명 편집</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {sections.map((section) => (
            <label key={section.key} className="space-y-1 block">
              <span className="text-sm text-gray-600">{section.key}</span>
              <input
                className="w-full border rounded px-3 py-2"
                value={menuLabels[section.key] ?? section.label}
                onChange={(e) => setMenuLabels((prev) => ({ ...prev, [section.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button className="px-4 py-2 rounded border" disabled={menuSaving} onClick={saveMenuLabels}>
          {menuSaving ? '메뉴 저장 중...' : '메뉴명 저장'}
        </button>
      </section>

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">푸터 정보 편집</h2>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="회사명"
          value={footer.companyName}
          onChange={(e) => setFooter((prev) => ({ ...prev, companyName: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="대표/사업자번호 정보"
          value={footer.companyInfo}
          onChange={(e) => setFooter((prev) => ({ ...prev, companyInfo: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="주소/연락처 정보"
          value={footer.addressInfo}
          onChange={(e) => setFooter((prev) => ({ ...prev, addressInfo: e.target.value }))}
        />
        <button className="px-4 py-2 rounded border" disabled={footerSaving} onClick={saveFooter}>
          {footerSaving ? '푸터 저장 중...' : '푸터 저장'}
        </button>
      </section>

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </main>
  )
}
