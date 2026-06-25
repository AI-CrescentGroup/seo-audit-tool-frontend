'use client'

import { useEffect } from 'react'

export default function GSCConnectedPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/'
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">✓</div>
        <h1 className="text-3xl font-bold text-white">Google Search Console Connected</h1>
        <p className="text-slate-400 text-lg">
          Search performance data will now appear in your SEO audits.
        </p>
        <p className="text-slate-500 text-sm">
          Redirecting to home in 3 seconds...
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded bg-brand-600 text-white hover:bg-brand-500 transition-colors font-medium"
        >
          Go to Home
        </a>
      </div>
    </main>
  )
}
