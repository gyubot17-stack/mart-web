export type SiteSection = {
  label: string
  slug: string
}

export const siteSections: SiteSection[] = [
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

export function getSectionLabel(slug: string) {
  return siteSections.find((s) => s.slug === slug)?.label ?? slug
}
