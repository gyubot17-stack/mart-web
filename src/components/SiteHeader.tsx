'use client'

import Link from 'next/link'
import { useState } from 'react'

type Item = { label: string; slug: string }
type Child = { label: string; href: string; visible?: boolean }
type SubmenuMap = Record<string, Child[]>

function fallbackChildren(item: Item): Child[] {
  if (item.slug === 'support') {
    return [
      { label: '문의하기', href: '/support#inquiry', visible: true },
      { label: '개인정보처리방침', href: '/privacy', visible: true },
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
    const source = Array.isArray(fromConfig) && fromConfig.length > 0 ? fromConfig : fallbackChildren(item)
    return source.filter((c) => c.visible !== false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="hidden md:flex items-stretch w-full">
          {([{ label: '홈', href: '/', slug: '' }, ...items.map((it) => ({ label: it.label, href: `/${it.slug}`, slug: it.slug }))] as const).map((entry, idx, arr) => {
            const isActive = entry.slug ? currentSlug === entry.slug : !currentSlug
            const children = entry.slug ? getChildren({ label: entry.label, slug: entry.slug }) : []
            return (
              <div
                key={`${entry.href}-${idx}`}
                className={`relative flex-1 min-w-0 ${idx === 0 ? 'mr-[120px]' : ''}`}
                onMouseEnter={() => children.length > 0 && setOpenedSlug(entry.slug)}
                onMouseLeave={() => setOpenedSlug(null)}
              >
                <Link href={entry.href} className={`ui-nav-item ui-nav-item-wide ${isActive ? 'ui-nav-item-active' : ''}`}>
                  {entry.label}
                </Link>

                {children.length > 0 && openedSlug === entry.slug ? (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1 min-w-56 z-20">
                    <div className="rounded-b-md border border-slate-200 border-t-0 bg-white shadow-md overflow-hidden">
                      {children.map((child) => (
                        <Link key={child.href} href={child.href} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {idx < arr.length - 1 ? <span className="ui-nav-sep ui-nav-sep-abs">|</span> : null}
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
                      <Link key={child.href} href={child.href} className="block rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700">
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
