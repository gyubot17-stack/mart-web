import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mrtk-web.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '(주)엠알텍-mrtc',
    template: '%s | (주)엠알텍-mrtc',
  },
  description: '엠알텍(mrtc) 공식 웹사이트',
  openGraph: {
    title: '(주)엠알텍-mrtc',
    description: '엠알텍(mrtc) 공식 웹사이트',
    url: siteUrl,
    siteName: '(주)엠알텍-mrtc',
    locale: 'ko_KR',
    type: 'website',
    images: ['/brand-og.svg'],
  },
  icons: {
    icon: '/brand-icon.svg',
    shortcut: '/brand-icon.svg',
    apple: '/brand-icon.svg',
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <AnalyticsTracker />
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  )
}
