import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function PrivacyPage() {
  const { data } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', 'privacy_policy')
    .maybeSingle()

  const title = data?.title || '개인정보처리방침'
  const body = data?.body || '개인정보처리방침 내용을 관리자에서 입력해주세요.'

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 md:px-6 py-12">
      <section className="ui-card p-6 md:p-8 space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <article className="whitespace-pre-wrap leading-7 text-slate-700">{body}</article>
      </section>
    </main>
  )
}
