import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO Intelligence Audit Tool — Crescent Group',
  description: 'Comprehensive website SEO audits powered by AI. Crawl, analyse, and fix your site in seconds.',
  openGraph: {
    title: 'SEO Intelligence Audit Tool',
    description: 'Comprehensive website SEO audits powered by AI.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
