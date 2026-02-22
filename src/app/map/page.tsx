import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { supabaseAdmin } from '@/lib/supabase-server'
import { buildSiteSections, parseMenuLabels, parseMenuVisibility } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

const defaultAddress = '경남 함안군 법수면 법정로 114'

export default async function MapPage() {
  const [{ data: menuConfig }, { data: menuVisibilityConfig }, { data: submenuConfig }, { data: headerIconConfig }, { data: mapPageContent }, { data: mapConfigRow }, { data: footerConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_visibility').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'submenu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'header_icon').maybeSingle(),
    supabaseAdmin.from('site_content').select('title,subtitle,body').eq('key', 'map').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'map_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const menuVisibility = parseMenuVisibility(menuVisibilityConfig?.body)
  const siteSections = buildSiteSections(menuLabels, menuVisibility)

  let submenus: Record<string, { label: string; href: string }[]> = {}
  try {
    const parsed = JSON.parse(submenuConfig?.body || '{}')
    if (parsed && typeof parsed === 'object') submenus = parsed
  } catch {}

  let homeIconUrl = ''
  let homeIconSize = 28
  if (headerIconConfig?.body) {
    try {
      const parsed = JSON.parse(headerIconConfig.body)
      homeIconUrl = String(parsed?.url || '')
      homeIconSize = Number(parsed?.size) || 28
    } catch {
      homeIconUrl = String(headerIconConfig.body || '')
    }
  }

  let address = defaultAddress
  let embedUrl = ''
  if (mapConfigRow?.body) {
    try {
      const parsed = JSON.parse(mapConfigRow.body)
      address = String(parsed?.address || defaultAddress)
      embedUrl = String(parsed?.embedUrl || '')
    } catch {}
  }

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

  const title = mapPageContent?.title || '찾아오시는 길'
  const subtitle = mapPageContent?.subtitle || ''
  const body = mapPageContent?.body || ''

  const naverSearchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <SiteHeader items={siteSections} currentSlug="map" submenus={submenus} homeIconUrl={homeIconUrl} homeIconSize={homeIconSize} />

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-4">
        <h1 className="ui-page-title">{title}</h1>
        {subtitle ? <p className="text-base text-gray-700">{subtitle}</p> : null}
        <p className="text-sm text-gray-700">{address}</p>
        {body ? <div className="text-sm text-gray-700 whitespace-pre-wrap">{body}</div> : null}
        <a href={naverSearchUrl} target="_blank" rel="noreferrer" className="inline-flex px-3 py-2 rounded border text-sm">네이버지도에서 열기</a>

        {embedUrl ? (
          <div className="w-full overflow-hidden rounded-xl border">
            <iframe
              src={embedUrl}
              width="100%"
              height="560"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              title="네이버지도"
            />
          </div>
        ) : (
          <div className="w-full rounded-xl border p-6 text-sm text-gray-600">
            지도 임베드 URL이 아직 설정되지 않았습니다. 관리자 &gt; 콘텐츠 관리에서 map 페이지를 선택해 지도형 설정을 저장해주세요.
          </div>
        )}
      </section>

      <SiteFooter footer={footer} />
    </main>
  )
}
