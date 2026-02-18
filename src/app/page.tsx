import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const menuItems = [
  { label: '회사소개', id: 'company' },
  { label: '콤프레샤', id: 'compressor' },
  { label: '에어크리닝시스템', id: 'air-cleaning' },
  { label: '발전기', id: 'generator' },
  { label: '친환경에너지', id: 'eco-energy' },
  { label: '산업기계', id: 'industrial' },
  { label: '거래실적', id: 'records' },
  { label: '특가판매', id: 'special-sale' },
  { label: '제품AS', id: 'as' },
  { label: '고객센터', id: 'support' },
]

export default async function Home() {
  const { data } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', 'home')
    .single()

  const title = data?.title ?? 'mrtc.kr'
  const subtitle = data?.subtitle ?? ''
  const body = data?.body ?? ''
  const image = data?.hero_image_url ?? ''

  return (
    <main id="top" className="min-h-screen bg-white text-gray-900">
      <a
        href="#top"
        className="fixed right-6 bottom-6 z-50 rounded-full bg-black text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-gray-800"
      >
        홈으로 ↑
      </a>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <a
            href="#top"
            className="shrink-0 px-4 py-2 rounded-md bg-black text-white text-sm font-semibold"
          >
            홈
          </a>
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-14 space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-xl text-gray-600">{subtitle}</p> : null}
        </div>

        {image ? (
          <img
            src={image}
            alt="hero"
            className="w-full rounded-2xl border object-cover max-h-[420px]"
          />
        ) : (
          <div className="w-full rounded-2xl border border-dashed min-h-[280px] flex items-center justify-center text-gray-400">
            메인 이미지 업로드 영역
          </div>
        )}

        <article className="whitespace-pre-wrap leading-7 text-gray-700">{body}</article>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <section key={item.id} id={item.id} className="border rounded-xl p-6 space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold">{item.label}</h2>
            <div className="w-full min-h-44 rounded-lg border border-dashed flex items-center justify-center text-gray-400">
              이미지 영역 (추후 업로드)
            </div>
            <p className="text-gray-600 text-sm leading-6">
              {item.label} 상세 내용을 입력할 자리입니다. 관리자 페이지 고도화 단계에서
              각 섹션별 텍스트/이미지 편집 기능으로 확장할 수 있습니다.
            </p>
          </section>
        ))}
      </section>

      <footer className="border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">mrtc.kr</p>
          <p>대표: (입력 예정) | 사업자번호: (입력 예정)</p>
          <p>주소: (입력 예정) | 연락처: (입력 예정)</p>
          <p className="text-gray-500">© {new Date().getFullYear()} mrtc.kr. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
