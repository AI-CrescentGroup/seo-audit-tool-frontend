'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listAudits, AuditResult } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'

function scoreBadge(score: number) {
  if (score >= 70) return { text: 'text-green-400', bg: 'bg-green-900/30 border-green-700' }
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700' }
  return { text: 'text-red-400', bg: 'bg-red-900/30 border-red-700' }
}

function statusStyle(status: AuditResult['status']) {
  switch (status) {
    case 'completed':
      return 'bg-green-900/40 text-green-400 border-green-800'
    case 'cached':
      return 'bg-brand-900/40 text-brand-400 border-brand-700'
    case 'processing':
      return 'bg-amber-900/40 text-amber-400 border-amber-800'
    default:
      return 'bg-red-900/40 text-red-400 border-red-800'
  }
}

function AuditCard({ audit }: { audit: AuditResult }) {
  const score = audit.ai_recommendations?.overall_score ?? 0
  const badge = scoreBadge(score)

  const card = (
    <div className="group h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-brand-600 hover:bg-slate-900 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors" title={audit.domain}>
          {audit.domain}
        </h2>
        <div className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-lg border ${badge.bg} ${badge.text}`}>
          {score}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusStyle(audit.status)}`}>
          {audit.status}
        </span>
        <span className="text-slate-400">
          {audit.pages_crawled} {audit.pages_crawled === 1 ? 'page' : 'pages'}
        </span>
      </div>
    </div>
  )

  if (!audit.id) return card

  return (
    <Link href={`/results/${audit.id}`} className="block h-full">
      {card}
    </Link>
  )
}

export default function PastAuditsPage() {
  const [audits, setAudits] = useState<AuditResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await listAudits(20)
        if (active) setAudits(data)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load past audits')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#0b0f19]">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-semibold">Crescent Group</span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← New audit
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-white">Past Audits</h1>
          <p className="text-slate-400 text-sm mt-1">Your 20 most recent SEO crawls.</p>
        </div>

        {loading ? (
          <LoadingSpinner step={3} domain={undefined} />
        ) : error ? (
          <div className="rounded-2xl border border-red-800 bg-red-900/20 p-8 text-center max-w-md mx-auto animate-fade-in">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-white">Couldn’t load past audits</h2>
            <p className="text-slate-400 text-sm mt-2">{error}</p>
            <p className="text-slate-500 text-xs mt-3">
              Make sure the backend is running on <code className="text-slate-300">http://localhost:8080</code>.
            </p>
          </div>
        ) : audits.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center max-w-md mx-auto animate-fade-in">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-bold text-white">No audits yet</h2>
            <p className="text-slate-400 text-sm mt-2">Run your first audit to see it here.</p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              Start an audit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-up">
            {audits.map((audit, i) => (
              <AuditCard key={audit.id ?? `${audit.domain}-${i}`} audit={audit} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
