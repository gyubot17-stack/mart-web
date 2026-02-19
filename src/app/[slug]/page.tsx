import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import HeroBlock from '@/components/HeroBlock'
import InquiryForm from '@/components/InquiryForm'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { buildSiteSections, getSectionLabel, parseMenuLabels } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const [{ data: menuConfig }, { data }] = await Promise.all([
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('title,subtitle').eq('key', slug).maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const sectionTitle = data?.title || getSectionLabel(slug, menuLabels)
  const description = data?.subtitle || `${sectionTitle} 안내 페이지`

  return {
    title: sectionTitle,
    description,
    openGraph: {
      title: `${sectionTitle} | (주)엠알텍-mrtc`,
      description,
    },
    alternates: {
      canonical: `/${slug}`,
    },
  }
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

  const [{ data: menuConfig }, { data }, { data: extraData }, { data: footerConfig }, { data: styleConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('*').eq('key', slug).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', `${slug}_extra`).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', `${slug}_style`).maybeSingle(),
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

  let style = {
    heroHeight: 420,
    galleryHeight: 160,
    productHeight: 128,
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

  if (styleConfig?.body) {
    try {
      const parsed = JSON.parse(styleConfig.body)
      style = {
        heroHeight: Number(parsed?.heroHeight) || style.heroHeight,
        galleryHeight: Number(parsed?.galleryHeight) || style.galleryHeight,
        productHeight: Number(parsed?.productHeight) || style.productHeight,
      }
    } catch {}
  }

  return (
    <main id="top" className="min-h-screen bg-white text-gray-900">
      <a href="#top" className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-50 rounded-full bg-black text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-gray-800">
        맨위로 ↑
      </a>

      <SiteHeader items={siteSections} currentSlug={slug} />

      <HeroBlock title={title} subtitle={subtitle} image={image} heroHeight={style.heroHeight} />

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-8 ui-fade-in">
        <div className="ui-card p-5 md:p-8 text-slate-700 leading-7 whitespace-pre-wrap">{body}</div>
      </section>

      {visibleGallery.length > 0 ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-8 space-y-4 ui-fade-in">
          <h2 className="text-2xl font-bold">갤러리</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {visibleGallery.map((item, i) => (
              <div key={i} className="ui-card min-h-40 overflow-hidden flex items-center justify-center text-slate-400">
                {item.url ? (
                  <Image src={item.url} alt={`gallery-${i + 1}`} width={480} height={style.galleryHeight} className="w-full object-cover" style={{ height: `${style.galleryHeight}px` }} sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  `갤러리 이미지 ${i + 1}`
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {visibleProducts.length > 0 ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16 space-y-4 ui-fade-in">
          <h2 className="text-2xl font-bold">제품 카드</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {visibleProducts.map((product, i) => (
              <article key={i} className="ui-card ui-card-hover p-4 space-y-3">
                <div className="ui-card min-h-32 overflow-hidden flex items-center justify-center text-slate-400">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} width={400} height={style.productHeight} className="w-full object-cover" style={{ height: `${style.productHeight}px` }} sizes="(max-width: 768px) 100vw, 33vw" />
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

      <SiteFooter footer={footer} />
    </main>
  )
}
