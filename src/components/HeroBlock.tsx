import Image from 'next/image'

export default function HeroBlock({
  title,
  subtitle,
  image,
  heroHeight,
}: {
  title: string
  subtitle?: string
  image?: string
  heroHeight: number
}) {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-14 pb-10 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="text-lg text-slate-600">{subtitle}</p> : null}
      </div>

      {image ? (
        <div className="ui-card relative w-full overflow-hidden" style={{ height: `${heroHeight}px` }}>
          <Image src={image} alt={title} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 1200px" />
        </div>
      ) : (
        <div className="ui-card min-h-[260px] flex items-center justify-center text-slate-400">메인 이미지 업로드 영역</div>
      )}
    </section>
  )
}
