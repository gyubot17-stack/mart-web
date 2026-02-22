import Image from 'next/image'
import HeroCarousel from './HeroCarousel'

export default function HeroBlock({
  title,
  subtitle,
  image,
  images,
  heroHeight,
}: {
  title: string
  subtitle?: string
  image?: string
  images?: string[]
  heroHeight: number
}) {
  const validImages = (images || []).filter(Boolean)
  const hasCarousel = validImages.length > 1
  const singleImage = validImages[0] || image

  return (
    <section className="w-full pt-12 md:pt-14 pb-8 md:pb-10 ui-fade-in">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-tight">{title}</h1>
        {subtitle ? <p className="text-lg text-slate-600 max-w-3xl">{subtitle}</p> : null}
      </div>

      </div>

      {hasCarousel ? (
        <HeroCarousel images={validImages} title={title} heroHeight={heroHeight} />
      ) : singleImage ? (
        <div className="relative w-full overflow-hidden border-y border-slate-200/80" style={{ height: `${heroHeight}px` }}>
          <Image src={singleImage} alt={title} fill priority className="object-cover" sizes="100vw" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="ui-card min-h-[260px] flex items-center justify-center text-slate-400">메인 이미지 업로드 영역</div>
        </div>
      )}
    </section>
  )
}
