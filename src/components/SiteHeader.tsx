import Link from 'next/link'

type Item = { label: string; slug: string }

export default function SiteHeader({ items, currentSlug }: { items: Item[]; currentSlug?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/" className="ui-chip ui-chip-active">홈</Link>
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/${item.slug}`}
            className={`ui-chip ${currentSlug === item.slug ? 'ui-chip-active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
