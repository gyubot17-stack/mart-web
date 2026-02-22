'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HeroCarousel({
  images,
  title,
  heroHeight,
}: {
  images: string[]
  title: string
  heroHeight: number
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className="relative w-full overflow-hidden border-y border-slate-200/80" style={{ height: `${heroHeight}px` }}>
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${index === i ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image src={src} alt={`${title}-${i + 1}`} fill priority={i === 0} className="object-cover" sizes="100vw" />
        </div>
      ))}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`slide-${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full border border-white/80 ${index === i ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}
