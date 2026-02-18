'use client'

import { useEffect, useMemo, useState } from 'react'

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

type Inquiry = {
  key: string
  name: string
  phone: string
  message: string
  createdAt: string | null
  status: 'new' | 'done'
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
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'done'>('all')
  const [menuSaving, setMenuSaving] = useState(false)
  const [footerSaving, setFooterSaving] = useState(false)
  const [message, setMessage] = useState('')

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((q) => {
      const byStatus = statusFilter === 'all' ? true : q.status === statusFilter
      const needle = query.trim().toLowerCase()
      const byText =
        !needle ||
        q.name.toLowerCase().includes(needle) ||
        q.phone.toLowerCase().includes(needle) ||
        q.message.toLowerCase().includes(needle)
      return byStatus && byText
    })
  }, [inquiries, query, statusFilter])

  async function refreshInquiries() {
    const res = await fetch('/api/admin/inquiries', { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) setInquiries(json?.inquiries ?? [])
  }

  useEffect(() => {
    ;(async () => {
      const [menuRes, footerRes, inquiriesRes] = await Promise.all([
        fetch('/api/content?key=menu_config', { cache: 'no-store' }),
        fetch('/api/content?key=footer_config', { cache: 'no-store' }),
        fetch('/api/admin/inquiries', { cache: 'no-store' }),
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

      const inquiriesJson = await inquiriesRes.json()
      if (inquiriesRes.ok) setInquiries(inquiriesJson?.inquiries ?? [])

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

  async function deleteInquiry(key: string) {
    if (!confirm('이 문의를 삭제할까요?')) return

    const res = await fetch(`/api/admin/inquiries?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) {
      setMessage(`문의 삭제 실패: ${json?.error ?? 'unknown'}`)
      return
    }

    setMessage('문의 삭제 완료 ✅')
    await refreshInquiries()
  }

  function downloadCsv() {
    const headers = ['key', 'status', 'name', 'phone', 'message', 'createdAt']
    const escape = (v: string) => `"${String(v ?? '').replaceAll('"', '""')}"`
    const rows = filteredInquiries.map((q) =>
      [q.key, q.status, q.name, q.phone, q.message, q.createdAt ?? ''].map(escape).join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inquiries-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">고객 문의 관리</h2>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="border rounded px-3 py-2 text-sm min-w-56"
            placeholder="이름/연락처/내용 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'done')}
          >
            <option value="all">전체</option>
            <option value="new">신규</option>
            <option value="done">처리완료</option>
          </select>
          <button className="px-3 py-2 text-sm rounded border" onClick={downloadCsv}>CSV 다운로드</button>
          <button className="px-3 py-2 text-sm rounded border" onClick={refreshInquiries}>새로고침</button>
        </div>

        <div className="space-y-3">
          {filteredInquiries.length === 0 ? (
            <p className="text-sm text-gray-500">조건에 맞는 문의가 없습니다.</p>
          ) : filteredInquiries.map((q) => (
            <div key={q.key} className="border rounded p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{q.name} / {q.phone}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${q.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {q.status === 'done' ? '처리완료' : '신규'}
                  </span>
                  <button
                    className="px-2 py-1 text-xs rounded border"
                    onClick={() => toggleInquiryStatus(q.key, q.status === 'done' ? 'new' : 'done')}
                  >
                    {q.status === 'done' ? '신규로 변경' : '완료로 변경'}
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded border text-red-600"
                    onClick={() => deleteInquiry(q.key)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.message}</p>
              {q.createdAt ? <p className="text-xs text-gray-500">접수시각: {new Date(q.createdAt).toLocaleString()}</p> : null}
            </div>
          ))}
        </div>
      </section>

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </main>
  )
}
