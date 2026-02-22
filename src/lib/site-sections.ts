export type SiteSection = {
  label: string
  slug: string
}

export const defaultSiteSections: SiteSection[] = [
  { label: '회사소개', slug: 'company' },
  { label: '콤프레샤', slug: 'compressor' },
  { label: '에어크리닝시스템', slug: 'air-cleaning' },
  { label: '발전기', slug: 'generator' },
  { label: '친환경에너지', slug: 'eco-energy' },
  { label: '산업기계', slug: 'industrial' },
  { label: '거래실적', slug: 'records' },
  { label: '특가판매', slug: 'special-sale' },
  { label: '제품AS', slug: 'as' },
  { label: '고객센터', slug: 'support' },
]

export function buildSiteSections(menuLabels?: Record<string, string>, menuVisibility?: Record<string, boolean>): SiteSection[] {
  return defaultSiteSections
    .filter((section) => menuVisibility?.[section.slug] !== false)
    .map((section) => ({
      ...section,
      label: menuLabels?.[section.slug]?.trim() || section.label,
    }))
}

export function getSectionLabel(slug: string, menuLabels?: Record<string, string>) {
  const found = defaultSiteSections.find((s) => s.slug === slug)
  if (!found) return slug
  return menuLabels?.[slug]?.trim() || found.label
}

export function parseMenuLabels(rawBody?: string | null): Record<string, string> {
  if (!rawBody) return {}
  try {
    const parsed = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}


export function parseMenuVisibility(rawBody?: string | null): Record<string, boolean> {
  if (!rawBody) return {}
  try {
    const parsed = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as Record<string, boolean>
  } catch {
    return {}
  }
}
