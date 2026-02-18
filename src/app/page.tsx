import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-server'
import { siteSections } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

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
          {siteSections.map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className="shrink-0 px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
            >
              {item.label}
            </Link>
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
        {siteSections.map((item) => (
          <Link key={item.slug} href={`/${item.slug}`} className="border rounded-xl p-6 space-y-4 hover:bg-gray-50">
            <h2 className="text-2xl font-bold">{item.label}</h2>
            <div className="w-full min-h-44 rounded-lg border border-dashed flex items-center justify-center text-gray-400">
              이미지 영역 (추후 업로드)
            </div>
            <p className="text-gray-600 text-sm leading-6">
              클릭하면 {item.label} 상세 페이지로 이동합니다.
            </p>
          </Link>
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
