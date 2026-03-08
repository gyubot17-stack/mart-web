import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import HeroBlock from '@/components/HeroBlock'
import InquiryForm from '@/components/InquiryForm'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { buildSiteSections, getSectionLabel, parseMenuLabels, parseMenuVisibility } from '@/lib/site-sections'

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

const draftDefaults: Record<string, { subtitle: string; body: string }> = {
  company: {
    subtitle: '신뢰를 기반으로 산업 현장과 함께 성장해온 MRTK 소개',
    body: '회사연혁과 주요 프로젝트를 통해 MRTK의 기술 축적 과정을 소개합니다.\n현장 중심 대응과 사후 지원 체계를 핵심 가치로 운영합니다.',
  },
  compressor: {
    subtitle: '현장 목적에 맞춰 구성하는 프로덕트 라인업',
    body: '프로덕트A/B/C를 중심으로 용량, 운전 환경, 유지보수 조건을 고려해 최적의 구성을 제안합니다.',
  },
  as: {
    subtitle: '기술자료부터 A/S까지 운영 지원',
    body: '기술자료, 카탈로그, 설치사례를 기반으로 빠른 대응을 제공합니다.\n장애 접수 후 진단-조치-이력관리까지 표준 프로세스로 진행합니다.',
  },
  support: {
    subtitle: '빠른 문의 접수와 정확한 안내',
    body: '공지사항과 견적문의를 통해 필요한 정보를 빠르게 전달합니다.\n문의 내용은 운영자가 확인 후 순차적으로 답변드립니다.',
  },
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

function renderBodyContent(body: string, className: string) {
  const hasHtml = /<[^>]+>/.test(body)
  if (hasHtml) return <div className={className} dangerouslySetInnerHTML={{ __html: body }} />
  return <div className={`${className} whitespace-pre-wrap`}>{body}</div>
}

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [{ data: menuConfig }, { data: menuVisibilityConfig }, { data: submenuConfig }, { data: headerIconConfig }, { data }, { data: extraData }, { data: footerConfig }, { data: styleConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_visibility').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'submenu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'header_icon').maybeSingle(),
    supabaseAdmin.from('site_content').select('*').eq('key', slug).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', `${slug}_extra`).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', `${slug}_style`).maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const menuVisibility = parseMenuVisibility(menuVisibilityConfig?.body)
  const siteSections = buildSiteSections(menuLabels, menuVisibility)
  let submenus: Record<string, { label: string; href: string }[]> = {}
  try {
    const parsed = JSON.parse(submenuConfig?.body || '{}')
    if (parsed && typeof parsed === 'object') submenus = parsed
  } catch {}

  const submenuSlugs = Object.values(submenus)
    .flat()
    .map((item: any) => String(item?.href || '').trim())
    .filter((href) => href.startsWith('/') && !href.includes('#'))
    .map((href) => href.slice(1))
    .filter((path) => path.length > 0 && !path.includes('/'))

  const exists = siteSections.some((s) => s.slug === slug) || submenuSlugs.includes(slug)
  if (!exists) notFound()

  const title = data?.title || getSectionLabel(slug, menuLabels)
  const subtitle = data?.subtitle || draftDefaults[slug]?.subtitle || ''
  const body = data?.body || draftDefaults[slug]?.body || '이 섹션의 상세 내용은 관리자 페이지에서 입력할 수 있습니다.'
  const image = data?.hero_image_url || ''
  const extra = parseExtra(extraData?.body)
  const visibleGallery = extra.gallery.filter((g) => g.visible)
  const visibleProducts = (extra.products.filter((p) => p.visible).length > 0
    ? extra.products.filter((p) => p.visible)
    : slug === 'compressor'
      ? [
          { name: '프로덕트A', desc: '고효율 표준형 라인업', image: '', link: '', visible: true },
          { name: '프로덕트B', desc: '저소음·안정 운전형 라인업', image: '', link: '', visible: true },
          { name: '프로덕트C', desc: '고부하 현장 대응형 라인업', image: '', link: '', visible: true },
        ]
      : [])


  let homeIconUrl = ''
  let homeIconSize = 28
  if (headerIconConfig?.body) {
    try {
      const parsed = JSON.parse(headerIconConfig.body)
      homeIconUrl = String(parsed?.url || '')
      homeIconSize = Number(parsed?.size) || 28
    } catch {
      homeIconUrl = String(headerIconConfig.body || '')
      homeIconSize = 28
    }
  }

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

      <SiteHeader items={siteSections} currentSlug={slug} submenus={submenus} homeIconUrl={homeIconUrl} homeIconSize={homeIconSize} />

      <HeroBlock title={title} subtitle={subtitle} image={image} heroHeight={style.heroHeight} />

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 ui-fade-in">
        {renderBodyContent(body, "p-1 md:p-2 text-slate-700 leading-7")}
      </section>

      {visibleGallery.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 space-y-4 ui-fade-in">
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
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 space-y-4 ui-fade-in">
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
                {/* 문의하기 버튼 제거 요청 반영 */}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {slug === 'support' ? (
        <section id="inquiry" className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
          <InquiryForm />
        </section>
      ) : null}

      <SiteFooter footer={footer} />
    </main>
  )
}
