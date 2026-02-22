'use client'

import { useEffect, useMemo, useState } from 'react'

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
  note?: string
  createdAt: string | null
  status: 'new' | 'done'
}

type MapConfig = {
  address: string
  embedUrl: string
}

const defaultFooter: FooterConfig = {
  companyName: 'mrtc.kr',
  companyInfo: '대표: (입력 예정) | 사업자번호: (입력 예정)',
  addressInfo: '주소: (입력 예정) | 연락처: (입력 예정)',
}

const defaultMapConfig: MapConfig = {
  address: '경남 함안군 법수면 법정로 114',
  embedUrl: '',
}

export default function AdminCommonPage() {
  const [loading, setLoading] = useState(true)
  const [footer, setFooter] = useState<FooterConfig>(defaultFooter)
  const [homeIconUrl, setHomeIconUrl] = useState('')
  const [homeIconSize, setHomeIconSize] = useState(28)
  const [mapConfig, setMapConfig] = useState<MapConfig>(defaultMapConfig)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'done'>('all')
  const [menuSaving, setMenuSaving] = useState(false)
  const [footerSaving, setFooterSaving] = useState(false)
  const [iconSaving, setIconSaving] = useState(false)
  const [iconUploading, setIconUploading] = useState(false)
  const [privacySaving, setPrivacySaving] = useState(false)
  const [mapSaving, setMapSaving] = useState(false)
  const [privacyText, setPrivacyText] = useState('')
  const [message, setMessage] = useState('')
  const [analyticsFrom, setAnalyticsFrom] = useState('')
  const [analyticsTo, setAnalyticsTo] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [note, setNote] = useState('')
  const [analytics, setAnalytics] = useState<{
    rangeTotal: number
    totalDay: number
    totalMonth: number
    sources: { source: string; count: number }[]
    topPages: { path: string; count: number }[]
  } | null>(null)

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

  async function loadAnalytics(from?: string, to?: string) {
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)

    const res = await fetch(`/api/admin/analytics?${qs.toString()}`, { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) setAnalytics(json)
  }

  useEffect(() => {
    ;(async () => {
      const [footerRes, headerIconRes, mapRes, privacyRes, inquiriesRes, analyticsRes] = await Promise.all([
        fetch('/api/content?key=footer_config', { cache: 'no-store' }),
        fetch('/api/content?key=header_icon', { cache: 'no-store' }),
        fetch('/api/content?key=map_config', { cache: 'no-store' }),
        fetch('/api/content?key=privacy_policy', { cache: 'no-store' }),
        fetch('/api/admin/inquiries', { cache: 'no-store' }),
        fetch('/api/admin/analytics', { cache: 'no-store' }),
      ])

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


      const headerIconJson = await headerIconRes.json()
      if (headerIconRes.ok) {
        try {
          const parsed = JSON.parse(headerIconJson?.data?.body || '{}')
          setHomeIconUrl(String(parsed?.url || ''))
          setHomeIconSize(Number(parsed?.size) || 28)
        } catch {
          setHomeIconUrl(String(headerIconJson?.data?.body || ''))
          setHomeIconSize(28)
        }
      }

      const mapJson = await mapRes.json()
      if (mapRes.ok) {
        try {
          const parsed = JSON.parse(mapJson?.data?.body || '{}')
          setMapConfig({
            address: String(parsed?.address || defaultMapConfig.address),
            embedUrl: String(parsed?.embedUrl || ''),
          })
        } catch {
          setMapConfig(defaultMapConfig)
        }
      }

      const privacyJson = await privacyRes.json()
      if (privacyRes.ok) {
        setPrivacyText(privacyJson?.data?.body || '')
      }

      const inquiriesJson = await inquiriesRes.json()
      if (inquiriesRes.ok) setInquiries(inquiriesJson?.inquiries ?? [])

      const analyticsJson = await analyticsRes.json()
      if (analyticsRes.ok) setAnalytics(analyticsJson)

      setLoading(false)
    })()
  }, [])


  async function saveHeaderIcon(url?: string) {
    const finalUrl = typeof url === 'string' ? url : homeIconUrl
    setIconSaving(true)
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'header_icon',
        title: 'header icon',
        subtitle: '',
        body: JSON.stringify({ url: finalUrl, size: homeIconSize }),
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      setMessage('홈 아이콘 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`홈 아이콘 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setIconSaving(false)
  }

  async function uploadHeaderIcon(file: File) {
    setIconUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const up = await fetch('/api/upload', { method: 'POST', body: fd })
    const upJson = await up.json()
    if (!up.ok) {
      setMessage(`아이콘 업로드 실패: ${upJson?.error ?? 'unknown'}`)
      setIconUploading(false)
      return
    }
    setHomeIconUrl(upJson.url)
    await saveHeaderIcon(upJson.url)
    setIconUploading(false)
  }

  function clearHeaderIcon() {
    setHomeIconUrl('')
    setMessage('아이콘 삭제 상태로 변경됨 (저장 버튼을 눌러 반영)')
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

  async function savePrivacyPolicy() {
    setPrivacySaving(true)
    const res = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'privacy_policy',
        title: '개인정보처리방침',
        subtitle: '',
        body: privacyText,
        hero_image_url: '',
      }),
    })

    if (res.ok) {
      setMessage('개인정보처리방침 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`개인정보처리방침 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setPrivacySaving(false)
  }

  async function saveMapConfig() {
    setMapSaving(true)
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

    if (res.ok) {
      setMessage('찾아오시는길 설정 저장 완료 ✅')
    } else {
      const json = await res.json()
      setMessage(`찾아오시는길 설정 저장 실패: ${json?.error ?? 'unknown'}`)
    }
    setMapSaving(false)
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
      body: JSON.stringify({ key, status: '', note }),
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
    <main className="min-h-screen pb-8 max-w-5xl mx-auto space-y-6">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin - 공통 관리</h1>
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

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">홈 아이콘 설정</h2>
        <p className="text-sm text-gray-600">업로드한 아이콘은 본페이지 좌측 상단 '홈' 텍스트 대신 표시됩니다.</p>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-3 px-3 py-2 rounded border bg-white text-sm font-medium cursor-pointer hover:bg-slate-50">
            아이콘 이미지 업로드
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadHeaderIcon(file)
              }}
            />
          </label>
        </div>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="아이콘 URL"
          value={homeIconUrl}
          onChange={(e) => setHomeIconUrl(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">아이콘 크기(px)</label>
          <input
            type="number"
            min={16}
            max={80}
            className="w-24 border rounded px-3 py-2 text-sm"
            value={homeIconSize}
            onChange={(e) => setHomeIconSize(Math.max(16, Math.min(80, Number(e.target.value) || 28)))}
          />
        </div>
        <p className="text-xs text-gray-500">권장: 배경 투명 PNG / 높이 28~40px</p>
        {homeIconUrl ? <img src={homeIconUrl} alt="home icon" className="w-auto object-contain" style={{ height: `${homeIconSize}px` }} /> : <p className="text-sm text-gray-500">아이콘 미설정</p>}
        {iconUploading ? <p className="text-xs text-blue-600">업로드 중...</p> : null}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded border" disabled={iconSaving} onClick={() => saveHeaderIcon()}>
            {iconSaving ? '아이콘 저장 중...' : '아이콘 저장'}
          </button>
          <button className="px-4 py-2 rounded border text-red-600" disabled={iconSaving} onClick={clearHeaderIcon}>
            아이콘 삭제
          </button>
        </div>
      </section>

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">찾아오시는길(/map) 설정</h2>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="기본 주소"
          value={mapConfig.address}
          onChange={(e) => setMapConfig((prev) => ({ ...prev, address: e.target.value }))}
        />
        <textarea
          className="w-full border rounded px-3 py-2 min-h-24"
          placeholder="네이버지도 iframe src URL 입력"
          value={mapConfig.embedUrl}
          onChange={(e) => setMapConfig((prev) => ({ ...prev, embedUrl: e.target.value }))}
        />
        <p className="text-xs text-gray-500">네이버지도 공유 &gt; 퍼가기에서 iframe src만 붙여넣으세요.</p>
        <button className="px-4 py-2 rounded border" disabled={mapSaving} onClick={saveMapConfig}>
          {mapSaving ? '지도 설정 저장 중...' : '지도 설정 저장'}
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
        <h2 className="text-lg font-semibold">개인정보처리방침 편집</h2>
        <textarea
          className="w-full border rounded p-3 min-h-56"
          placeholder="개인정보처리방침 내용을 입력하세요"
          value={privacyText}
          onChange={(e) => setPrivacyText(e.target.value)}
        />
        <button className="px-4 py-2 rounded border" disabled={privacySaving} onClick={savePrivacyPolicy}>
          {privacySaving ? '저장 중...' : '개인정보처리방침 저장'}
        </button>
      </section>

      <section className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">방문 통계 (간편)</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            시작일
            <input type="date" className="block border rounded px-3 py-2" value={analyticsFrom} onChange={(e) => setAnalyticsFrom(e.target.value)} />
          </label>
          <label className="text-sm">
            종료일
            <input type="date" className="block border rounded px-3 py-2" value={analyticsTo} onChange={(e) => setAnalyticsTo(e.target.value)} />
          </label>
          <button className="px-3 py-2 text-sm rounded border" onClick={() => loadAnalytics(analyticsFrom, analyticsTo)}>기간 조회</button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="border rounded p-3">총 방문자(최근 24h): <b>{analytics?.totalDay ?? 0}</b></div>
          <div className="border rounded p-3">총 방문자(최근 30d): <b>{analytics?.totalMonth ?? 0}</b></div>
          <div className="border rounded p-3">조회기간 방문수: <b>{analytics?.rangeTotal ?? 0}</b></div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded p-3 space-y-2">
            <p className="font-medium">Source</p>
            {(analytics?.sources ?? []).slice(0, 10).map((s) => (
              <p key={s.source} className="text-sm flex justify-between"><span>{s.source}</span><span>{s.count}</span></p>
            ))}
          </div>
          <div className="border rounded p-3 space-y-2">
            <p className="font-medium">하위 페이지 Top 3</p>
            {(analytics?.topPages ?? []).map((p) => (
              <p key={p.path} className="text-sm flex justify-between"><span>{p.path}</span><span>{p.count}</span></p>
            ))}
          </div>
        </div>
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
                    className="px-2 py-1 text-xs rounded border"
                    onClick={() => { setSelectedInquiry(q); setNote(q.note || '') }}
                  >
                    상세
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



      {selectedInquiry ? (
        <section className="border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">문의 상세</h2>
            <button className="px-3 py-1 text-sm rounded border" onClick={() => setSelectedInquiry(null)}>닫기</button>
          </div>
          <p className="text-sm"><b>이름:</b> {selectedInquiry.name}</p>
          <p className="text-sm"><b>연락처:</b> {selectedInquiry.phone}</p>
          <p className="text-sm whitespace-pre-wrap"><b>문의내용:</b> {selectedInquiry.message}</p>
          <textarea className="w-full border rounded p-3 min-h-24" placeholder="관리자 메모" value={note} onChange={(e)=>setNote(e.target.value)} />
          <button className="px-4 py-2 rounded border" onClick={() => saveInquiryNote(selectedInquiry.key)}>메모 저장</button>
        </section>
      ) : null}

      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
      </div>

      {message ? (
        <div className="fixed right-6 bottom-6 z-50 max-w-md rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-slate-800">{message}</p>
        </div>
      ) : null}
    </main>
  )
}
