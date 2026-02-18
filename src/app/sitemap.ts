import type { MetadataRoute } from 'next'
import { defaultSiteSections } from '@/lib/site-sections'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mrtk-web.vercel.app'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  const sectionRoutes: MetadataRoute.Sitemap = defaultSiteSections.map((section) => ({
    url: `${baseUrl}/${section.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...sectionRoutes]
}
