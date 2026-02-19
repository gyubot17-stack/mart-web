import { supabaseAdmin } from '@/lib/supabase-server'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { buildSiteSections, parseMenuLabels } from '@/lib/site-sections'

export const dynamic = 'force-dynamic'

export default async function PrivacyPage() {
  const [{ data }, { data: menuConfig }, { data: submenuConfig }, { data: footerConfig }] = await Promise.all([
    supabaseAdmin.from('site_content').select('*').eq('key', 'privacy_policy').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'menu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'submenu_config').maybeSingle(),
    supabaseAdmin.from('site_content').select('body').eq('key', 'footer_config').maybeSingle(),
  ])

  const menuLabels = parseMenuLabels(menuConfig?.body)
  const siteSections = buildSiteSections(menuLabels)

  let submenus: Record<string, { label: string; href: string }[]> = {}
  try {
    const parsed = JSON.parse(submenuConfig?.body || '{}')
    if (parsed && typeof parsed === 'object') submenus = parsed
  } catch {}

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

  const title = data?.title || '개인정보처리방침'
  const body = data?.body || '개인정보처리방침 내용을 관리자에서 입력해주세요.'

  return (
    <main className="min-h-screen">
      <SiteHeader items={siteSections} submenus={submenus} />
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="ui-card p-6 md:p-8 space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <article className="whitespace-pre-wrap leading-7 text-slate-700">{body}</article>
        </div>
      </section>
      <SiteFooter footer={footer} />
    </main>
  )
}
