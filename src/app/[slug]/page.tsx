import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import InquiryForm from '@/components/InquiryForm'
import { buildSiteSections, getSectionLabel, parseMenuLabels } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

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

const defaultExtra: SectionExtra = {
  gallery: [],
  products: [],
}

function parseExtra(raw?: string | null): SectionExtra {
  if (!raw) return defaultExtra
  try {
    const parsed = JSON.parse(raw) as Partial<SectionExtra>
    const gallery = Array.isArray(parsed.gallery)
      ? parsed.gallery.map((g) => {
          if (typeof g === 'string') return { url: g, visible: true }
          return {
            url: String((g as any)?.url || ''),
            visible: (g as any)?.visible !== false,
          }
        })
      : defaultExtra.gallery

    const products = Array.isArray(parsed.products)
      ? parsed.products.map((p, i) => ({
          name: p?.name || `제품명 ${i + 1}`,
          desc: p?.desc || '제품 설명을 입력할 수 있는 영역입니다.',
          image: p?.image || '',
          link: p?.link || '',
          visible: (p as any)?.visible !== false,
        }))
      : defaultExtra.products

    return { gallery, products }
  } catch {
    return defaultExtra
  }
}

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [{ data: menuConfig }, { data }, { data: extraData }, { data: footerConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('*').eq('key', slug).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', `${slug}_extra`).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const siteSections = buildSiteSections(menuLabels)

  const exists = siteSections.some((s) => s.slug === slug)
  if (!exists) notFound()

  const title = data?.title || getSectionLabel(slug, menuLabels)
  const subtitle = data?.subtitle || ''
  const body = data?.body || '이 섹션의 상세 내용은 관리자 페이지에서 입력할 수 있습니다.'
  const image = data?.hero_image_url || ''
  const extra = parseExtra(extraData?.body)
  const visibleGallery = extra.gallery.filter((g) => g.visible)
  const visibleProducts = extra.products.filter((p) => p.visible)

  let footer = {
    companyName: 'mrtc.kr',
    companyInfo: '대표: (입력 예정) | 사업자번호: (입력 예정)',
    addressInfo: '주소: (입력 예정) | 연락처: (입력 예정)',
  }

  if (footerConfig?.body) {
    try {
      const parsed = JSON.parse(footerConfig.body)
      footer = {
        companyName: parsed?.companyName || footer.companyName,
        companyInfo: parsed?.companyInfo || footer.companyInfo,
        addressInfo: parsed?.addressInfo || footer.addressInfo,
      }
    } catch {}
  }

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

      {visibleGallery.length > 0 ? (
        <section className="max-w-6xl mx-auto px-6 pb-8 space-y-4">
          <h2 className="text-2xl font-bold">갤러리</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {visibleGallery.map((item, i) => (
              <div key={i} className="min-h-40 rounded-lg border border-dashed overflow-hidden flex items-center justify-center text-gray-400">
                {item.url ? (
                  <img src={item.url} alt={`gallery-${i + 1}`} className="w-full h-40 object-cover" />
                ) : (
                  `갤러리 이미지 ${i + 1}`
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {visibleProducts.length > 0 ? (
        <section className="max-w-6xl mx-auto px-6 pb-16 space-y-4">
          <h2 className="text-2xl font-bold">제품 카드</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {visibleProducts.map((product, i) => (
              <article key={i} className="rounded-lg border p-4 space-y-3">
                <div className="min-h-32 rounded border border-dashed overflow-hidden flex items-center justify-center text-gray-400">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
                  ) : (
                    `제품 이미지 ${i + 1}`
                  )}
                </div>
                <h3 className="font-semibold">{product.name || `제품명 ${i + 1}`}</h3>
                <p className="text-sm text-gray-600">{product.desc || '제품 설명을 입력할 수 있는 영역입니다.'}</p>
                {product.link ? (
                  <a href={product.link} className="inline-block px-3 py-2 text-sm rounded bg-black text-white">
                    문의하기
                  </a>
                ) : (
                  <button className="px-3 py-2 text-sm rounded bg-black text-white">문의하기</button>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {slug === 'support' ? (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <InquiryForm />
        </section>
      ) : null}

      <footer className="border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">{footer.companyName}</p>
          <p>{footer.companyInfo}</p>
          <p>{footer.addressInfo}</p>
          <p className="text-gray-500">© {new Date().getFullYear()} {footer.companyName}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
