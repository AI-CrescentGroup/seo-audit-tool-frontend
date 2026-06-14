'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { auditDomain } from '@/utils/api'

export default function AuditForm() {
  const router = useRouter()
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validateDomain(value: string): string | null {
    const clean = value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!clean) return 'Please enter a domain.'
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(clean)) return 'Please enter a valid domain (e.g. example.com).'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validateDomain(domain)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const result = await auditDomain(domain)
      if (result.id) {
        router.push(`/results/${result.id}`)
      } else {
        setError('Audit started but no ID returned. Please try again.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg.includes('502') || msg.includes('503')) {
        setError('API server is not reachable. Make sure the backend is running on port 8000.')
      } else if (msg.includes('404')) {
        setError('Domain not found or unreachable.')
      } else {
        setError(`Audit failed: ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            🌐
          </div>
          <input
            type="text"
            value={domain}
            onChange={e => { setDomain(e.target.value); setError(null) }}
            placeholder="crescentgroup.in"
            className="w-full pl-10 pr-4 py-4 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:opacity-50 transition-all text-base"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="px-8 py-4 rounded-xl font-semibold text-white gradient-brand
            hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all shadow-lg shadow-brand-500/20 whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Starting…
            </span>
          ) : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 animate-fade-in">
          <span className="flex-shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <p className="text-slate-500 text-xs text-center">
        Enter your domain without https:// · Crawls up to 500 pages · Usually completes in 30–90s
      </p>
    </form>
  )
}
