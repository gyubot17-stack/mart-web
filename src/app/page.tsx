import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-server'
import HeroBlock from '@/components/HeroBlock'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { buildSiteSections, parseMenuLabels, parseMenuVisibility } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

function renderBodyContent(body: string, className: string) {
  const hasHtml = /<[^>]+>/.test(body)
  if (hasHtml) return <div className={className} dangerouslySetInnerHTML={{ __html: body }} />
  return <div className={`${className} whitespace-pre-wrap`}>{body}</div>
}

export default async function Home() {
  const [{ data }, { data: homeExtra }, { data: menuConfig }, { data: menuVisibilityConfig }, { data: submenuConfig }, { data: headerIconConfig }, { data: footerConfig }, { data: styleConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('*').eq('key', 'home').single(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'home_extra').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_visibility').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'submenu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'header_icon').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'home_style').maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const menuVisibility = parseMenuVisibility(menuVisibilityConfig?.body)
  const siteSections = buildSiteSections(menuLabels, menuVisibility)
  let submenus: Record<string, { label: string; href: string }[]> = {}
  try {
    const parsed = JSON.parse(submenuConfig?.body || '{}')
    if (parsed && typeof parsed === 'object') submenus = parsed
  } catch {}

  const title = data?.title ?? '산업용 압축기 솔루션 파트너'
  const subtitle = data?.subtitle ?? '현장에 맞는 공기압축 시스템을 제안하고 설치·유지보수까지 책임집니다.'
  const body = data?.body ?? 'MRTK는 산업 현장에 최적화된 압축기/건조기/부대설비를 공급합니다.\n상담부터 시공, 운영 지원까지 한 번에 제공합니다.'
  const image = data?.hero_image_url ?? ''

  let homeSlides: string[] = []
  if (homeExtra?.body) {
    try {
      const parsed = JSON.parse(homeExtra.body)
      if (Array.isArray(parsed?.gallery)) {
        homeSlides = parsed.gallery
          .map((g: any) => (typeof g === 'string' ? g : g?.url))
          .filter(Boolean)
      }
    } catch {}
  }


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
      <a href="#top" className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-50 rounded-full bg-black text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-gray-800">맨위로 ↑</a>

      <SiteHeader items={siteSections} submenus={submenus} homeIconUrl={homeIconUrl} homeIconSize={homeIconSize} />

      <HeroBlock title={title} subtitle={subtitle} image={image} images={homeSlides} heroHeight={style.heroHeight} />

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-[260px_1fr] gap-8 border-t border-slate-200 ui-fade-in">
        <div>
          <p className="text-sm tracking-[0.18em] text-slate-500">COMPANY</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">회사소개</h2>
        </div>
        <div className="space-y-4">
          <p className="text-xl md:text-2xl font-semibold leading-relaxed text-slate-900">
            한 번 설치로 끝나는 장비가 아니라,
            <br />
            오래 운영되는 시스템을 만듭니다.
          </p>
          {renderBodyContent(body, 'text-slate-700 leading-8')}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 border-t border-slate-200 ui-fade-in">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.18em] text-slate-500">PRODUCT</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">제품소개</h2>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {[
            { no: '01', name: '프로덕트A', desc: '고효율 표준형 라인업' },
            { no: '02', name: '프로덕트B', desc: '저소음·안정 운전형 라인업' },
            { no: '03', name: '프로덕트C', desc: '고부하 현장 대응형 라인업' },
          ].map((p) => (
            <article key={p.name} className="space-y-3 border-b border-slate-200 pb-6">
              <p className="text-sm text-slate-400">{p.no}</p>
              <h3 className="text-2xl font-semibold text-slate-900">{p.name}</h3>
              <p className="text-sm text-slate-600">{p.desc}</p>
              <Link href="/compressor" className="inline-flex items-center text-xs font-semibold tracking-[0.12em] text-slate-700 border-b border-slate-700">
                MORE
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white py-14 md:py-16 ui-fade-in">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.18em] text-slate-300">TECH SUPPORT</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold">기술자료와 설치사례를 확인해보세요</h2>
          </div>
          <Link href="/as" className="inline-flex items-center justify-center px-5 py-3 border border-white text-sm font-semibold hover:bg-white hover:text-slate-900 transition-colors">
            기술지원 바로가기
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-16 grid md:grid-cols-2 gap-4 md:gap-6 ui-fade-in">
        {siteSections.map((item) => (
          <Link key={item.slug} href={`/${item.slug}`} className="ui-card ui-card-hover p-5 md:p-6 space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">{item.label}</h2>
            <p className="text-gray-600 text-sm leading-6">{item.label} 페이지로 이동</p>
          </Link>
        ))}
      </section>
      <SiteFooter footer={footer} />
    </main>
  )
}
