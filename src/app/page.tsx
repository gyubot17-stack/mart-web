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
  return <div className={`${className} whitespace-pre-wrap`}>{renderBodyContent(body, "p-1 md:p-2 text-slate-700 leading-7")}</div>
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

  const title = data?.title ?? 'mrtc.kr'
  const subtitle = data?.subtitle ?? ''
  const body = data?.body ?? ''
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

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 ui-fade-in">
        <div className="p-1 md:p-2 text-slate-700 leading-7 whitespace-pre-wrap">{renderBodyContent(body, "p-1 md:p-2 text-slate-700 leading-7")}</div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16 grid md:grid-cols-2 gap-4 md:gap-6 ui-fade-in">
        {siteSections.map((item) => (
          <Link key={item.slug} href={`/${item.slug}`} className="ui-card ui-card-hover p-5 md:p-6 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">{item.label}</h2>
            <div className="w-full min-h-44 rounded-lg border border-dashed flex items-center justify-center text-gray-400">이미지 영역 (추후 업로드)</div>
            <p className="text-gray-600 text-sm leading-6">클릭하면 {item.label} 상세 페이지로 이동합니다.</p>
          </Link>
        ))}
      </section>
      <SiteFooter footer={footer} />
    </main>
  )
}
