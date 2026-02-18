import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getSectionLabel, siteSections } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const exists = siteSections.some((s) => s.slug === slug)
  if (!exists) notFound()

  const { data } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', slug)
    .maybeSingle()

  const title = data?.title || getSectionLabel(slug)
  const subtitle = data?.subtitle || ''
  const body = data?.body || '이 섹션의 상세 내용은 관리자 페이지에서 입력할 수 있습니다.'
  const image = data?.hero_image_url || ''

  return (
    <main id="top" className="min-h-screen bg-white text-gray-900">
      <a href="#top" className="fixed right-6 bottom-6 z-50 rounded-full bg-black text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-gray-800">
        홈으로 ↑
      </a>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <Link href="/" className="shrink-0 px-4 py-2 rounded-md bg-black text-white text-sm font-semibold">홈</Link>
          {siteSections.map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className={`shrink-0 px-4 py-2 rounded-md border text-sm hover:bg-gray-50 ${item.slug === slug ? 'bg-gray-100' : ''}`}
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
          <img src={image} alt={title} className="w-full rounded-2xl border object-cover max-h-[420px]" />
        ) : (
          <div className="w-full rounded-2xl border border-dashed min-h-[280px] flex items-center justify-center text-gray-400">
            이미지 업로드 영역
          </div>
        )}

        <article className="whitespace-pre-wrap leading-7 text-gray-700">{body}</article>
      </section>
    </main>
  )
}
