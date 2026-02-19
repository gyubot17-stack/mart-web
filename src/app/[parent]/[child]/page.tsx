import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HeroBlock from '@/components/HeroBlock'
import InquiryForm from '@/components/InquiryForm'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { buildSiteSections, getSectionLabel, parseMenuLabels } from '@/lib/site-sections'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ parent: string; child: string }> }): Promise<Metadata> {
  const { parent, child } = await params
  const key = `${decodeURIComponent(parent)}-${decodeURIComponent(child)}`

  const { data } = await supabaseAdmin.from('site_content').select('title,subtitle').eq('key', key).maybeSingle()
  const sectionTitle = data?.title || `${parent} - ${child}`
  const description = data?.subtitle || `${sectionTitle} 안내 페이지`

  return {
    title: sectionTitle,
    description,
    openGraph: {
      title: `${sectionTitle} | (주)엠알텍-mrtc`,
      description,
    },
    alternates: {
      canonical: `/${parent}/${child}`,
    },
  }
}

export default async function NestedSectionPage({ params }: { params: Promise<{ parent: string; child: string }> }) {
  const { parent, child } = await params
  const parentDecoded = decodeURIComponent(parent)
  const childDecoded = decodeURIComponent(child)
  const key = `${parentDecoded}-${childDecoded}`

  const [{ data: menuConfig }, { data: submenuConfig }, { data }, { data: footerConfig }, { data: styleConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'submenu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('*').eq('key', key).maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', `${key}_style`).maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const siteSections = buildSiteSections(menuLabels)
  const resolvedParent = siteSections.find((s) => s.slug === parentDecoded || s.label === parentDecoded)?.slug
  if (!resolvedParent) notFound()

  let submenus: Record<string, { label: string; href: string; visible?: boolean }[]> = {}
  try {
    const parsed = JSON.parse(submenuConfig?.body || '{}')
    if (parsed && typeof parsed === 'object') submenus = parsed
  } catch {}

  const title = data?.title || `${getSectionLabel(resolvedParent, menuLabels)} - ${childDecoded}`
  const subtitle = data?.subtitle || ''
  const body = data?.body || '이 페이지의 내용은 관리자 > 콘텐츠 관리에서 입력할 수 있습니다.'
  const image = data?.hero_image_url || ''

  let footer = {
    companyName: 'mrtc.kr',
    companyInfo: '대표: (입력 예정) | 사업자번호: (입력 예정)',
    addressInfo: '주소: (입력 예정) | 연락처: (입력 예정)',
  }

  let style = {
    heroHeight: 420,
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
      }
    } catch {}
  }

  return (
    <main id="top" className="min-h-screen bg-white text-gray-900">
      <a href="#top" className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-50 rounded-full bg-black text-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-gray-800">
        맨위로 ↑
      </a>

      <SiteHeader items={siteSections} currentSlug={resolvedParent} submenus={submenus} />
      <HeroBlock title={title} subtitle={subtitle} image={image} heroHeight={style.heroHeight} />

      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 ui-fade-in">
        <div className="p-1 md:p-2 text-slate-700 leading-7 whitespace-pre-wrap">{body}</div>
      </section>

      {resolvedParent === 'support' && childDecoded === 'inquiry' ? (
        <section id="inquiry" className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
          <InquiryForm />
        </section>
      ) : null}

      <SiteFooter footer={footer} />
    </main>
  )
}
