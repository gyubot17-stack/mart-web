import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '(주)엠알텍-admin',
  description: '엠알텍 관리자 페이지',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
