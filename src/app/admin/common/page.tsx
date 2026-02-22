'use client'

import { useEffect, useMemo, useState } from 'react'

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
  const [footer, setFooter] = useState<FooterConfig>(defaultFooter)
  const [homeIconUrl, setHomeIconUrl] = useState('')
  const [homeIconSize, setHomeIconSize] = useState(28)
  const [menuSaving, setMenuSaving] = useState(false)
  const [footerSaving, setFooterSaving] = useState(false)
  const [iconSaving, setIconSaving] = useState(false)
  const [iconUploading, setIconUploading] = useState(false)
  const [privacySaving, setPrivacySaving] = useState(false)
  const [privacyText, setPrivacyText] = useState('')
  const [message, setMessage] = useState('')
  const [analyticsFrom, setAnalyticsFrom] = useState('')
  const [analyticsTo, setAnalyticsTo] = useState('')
  const [analytics, setAnalytics] = useState<{
    rangeTotal: number
    totalDay: number
    totalMonth: number
    sources: { source: string; count: number }[]
    topPages: { path: string; count: number }[]
  } | null>(null)

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
      const [footerRes, headerIconRes, privacyRes, analyticsRes] = await Promise.all([
        fetch('/api/content?key=footer_config', { cache: 'no-store' }),
        fetch('/api/content?key=header_icon', { cache: 'no-store' }),
        fetch('/api/content?key=privacy_policy', { cache: 'no-store' }),
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

      const privacyJson = await privacyRes.json()
      if (privacyRes.ok) {
        setPrivacyText(privacyJson?.data?.body || '')
      }

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
