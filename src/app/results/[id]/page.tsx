'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getAudit, AuditResult } from '@/utils/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import ResultsDisplay from '@/components/ResultsDisplay'
import Link from 'next/link'

type LoadStep = 1 | 2 | 3

function inferStep(audit: AuditResult | null, elapsed: number): LoadStep {
  if (!audit) return 1
  if (audit.status === 'completed' || audit.status === 'cached') return 3
  if (elapsed > 30) return 2
  return 1
}

export default function ResultsPage() {
  const params = useParams()
  const id = params.id as string

  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  const fetchAudit = useCallback(async () => {
    try {
      const data = await getAudit(id)
      setAudit(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit')
      return null
    }
  }, [id])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      const data = await fetchAudit()
      if (data && (data.status === 'completed' || data.status === 'cached')) return
      // Poll every 2s while processing
      timer = setTimeout(poll, 2000)
    }

    poll()
    return () => clearTimeout(timer)
  }, [fetchAudit])

  // Elapsed time ticker for step inference
  useEffect(() => {
    if (audit?.status === 'completed' || audit?.status === 'cached') return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [audit, startedAt])

  const isDone = audit?.status === 'completed' || audit?.status === 'cached'

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Audit not found</h1>
          <p className="text-slate-400 text-sm">{error}</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity">
            Start new audit
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950/80 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-slate-400 text-sm">
              {isDone ? (
                <span className="text-white font-medium">{audit?.domain}</span>
              ) : (
                'Running audit…'
              )}
            </span>
          </div>
          {isDone && (
            <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 rounded-full px-3 py-1">
              ✓ Complete
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {!isDone ? (
          <LoadingSpinner
            pagesCrawled={audit?.pages_crawled ?? 0}
            step={inferStep(audit, elapsed)}
            domain={audit?.domain}
          />
        ) : (
          audit && <ResultsDisplay audit={audit} />
        )}
      </div>
    </main>
  )
}
