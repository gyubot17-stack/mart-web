import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('key', 'home')
    .single()

  const title = data?.title ?? 'mrtc.kr'
  const subtitle = data?.subtitle ?? ''
  const body = data?.body ?? ''
  const image = data?.hero_image_url ?? ''

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-xl text-gray-600">{subtitle}</p> : null}
        </div>

        {image ? (
          <img
            src={image}
            alt="hero"
            className="w-full rounded-2xl border object-cover max-h-[420px]"
          />
        ) : null}

        <article className="prose prose-gray max-w-none whitespace-pre-wrap">
          {body}
        </article>
      </section>
    </main>
  )
}
