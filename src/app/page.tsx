import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-server'
import HeroBlock from '@/components/HeroBlock'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { buildSiteSections, parseMenuLabels } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [{ data }, { data: menuConfig }, { data: footerConfig }, { data: styleConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('*').eq('key', 'home').single(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'home_style').maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const siteSections = buildSiteSections(menuLabels)

  const title = data?.title ?? 'mrtc.kr'
  const subtitle = data?.subtitle ?? ''
  const body = data?.body ?? ''
  const image = data?.hero_image_url ?? ''

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
      <a href="#top" className="fixed right-6 bottom-6 z-50 rounded-full bg-black text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-gray-800">홈으로 ↑</a>

      <SiteHeader items={siteSections} />

      <HeroBlock title={title} subtitle={subtitle} image={image} heroHeight={style.heroHeight} />

      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="ui-card p-6 md:p-8 text-slate-700 leading-7 whitespace-pre-wrap">{body}</div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-6">
        {siteSections.map((item) => (
          <Link key={item.slug} href={`/${item.slug}`} className="ui-card ui-card-hover p-6 space-y-4">
            <h2 className="text-2xl font-bold">{item.label}</h2>
            <div className="w-full min-h-44 rounded-lg border border-dashed flex items-center justify-center text-gray-400">이미지 영역 (추후 업로드)</div>
            <p className="text-gray-600 text-sm leading-6">클릭하면 {item.label} 상세 페이지로 이동합니다.</p>
          </Link>
        ))}
      </section>
      <SiteFooter footer={footer} />
    </main>
  )
}
