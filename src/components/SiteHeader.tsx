'use client'

import Link from 'next/link'
import { useState } from 'react'

type Item = { label: string; slug: string }
type Child = { label: string; href: string }
type SubmenuMap = Record<string, Child[]>

function fallbackChildren(item: Item): Child[] {
  if (item.slug === 'support') {
    return [
      { label: '문의하기', href: '/support#inquiry' },
      { label: '개인정보처리방침', href: '/privacy' },
    ]
  }
  return []
}

export default function SiteHeader({
  items,
  currentSlug,
  submenus,
}: {
  items: Item[]
  currentSlug?: string
  submenus?: SubmenuMap
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openedSlug, setOpenedSlug] = useState<string | null>(null)

  const getChildren = (item: Item): Child[] => {
    const fromConfig = submenus?.[item.slug]
    if (Array.isArray(fromConfig) && fromConfig.length > 0) return fromConfig
    return fallbackChildren(item)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className={`ui-chip ${!currentSlug ? 'ui-chip-active' : ''}`}>홈</Link>
          {items.map((item) => {
            const isActive = currentSlug === item.slug
            const children = getChildren(item)
            return (
              <div
                key={item.slug}
                className="relative group"
                onMouseEnter={() => children.length > 0 && setOpenedSlug(item.slug)}
                onMouseLeave={() => setOpenedSlug(null)}
              >
                <Link href={`/${item.slug}`} className={`ui-chip ${isActive ? 'ui-chip-active' : ''}`}>
                  {item.label}
                </Link>

                {children.length > 0 && openedSlug === item.slug ? (
                  <div className="absolute left-0 top-full pt-2 min-w-48">
                    <div className="ui-card p-2 space-y-1">
                      {children.map((child) => (
                        <Link key={child.href} href={child.href} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <button className="md:hidden ui-chip" onClick={() => setMobileOpen((v) => !v)}>
          메뉴
        </button>
      </div>

      {mobileOpen ? (
        <div className="md:hidden border-t border-slate-200 bg-white/95 px-4 py-3 space-y-2">
          <Link href="/" className={`block ui-chip w-full text-center ${!currentSlug ? 'ui-chip-active' : ''}`}>홈</Link>
          {items.map((item) => {
            const children = getChildren(item)
            const expanded = openedSlug === item.slug
            return (
              <div key={item.slug} className="space-y-1">
                <div className="flex gap-2">
                  <Link href={`/${item.slug}`} className={`ui-chip flex-1 text-center ${currentSlug === item.slug ? 'ui-chip-active' : ''}`}>
                    {item.label}
                  </Link>
                  {children.length > 0 ? (
                    <button className="ui-chip px-3" onClick={() => setOpenedSlug(expanded ? null : item.slug)}>
                      {expanded ? '−' : '+'}
                    </button>
                  ) : null}
                </div>
                {children.length > 0 && expanded ? (
                  <div className="pl-2 space-y-1">
                    {children.map((child) => (
                      <Link key={child.href} href={child.href} className="block rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </header>
  )
}
