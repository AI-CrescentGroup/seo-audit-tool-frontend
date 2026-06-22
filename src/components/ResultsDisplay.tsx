'use client'

import { useState } from 'react'
import { AuditResult, downloadPdf, rewriteForGeo } from '@/utils/api'
import ScoreCard from './ScoreCard'
import IssueCard from './IssueCard'
import Link from 'next/link'

interface Props {
  audit: AuditResult
}

const SEVERITY_COLOR = {
  high:   'text-red-400 bg-red-900/30 border-red-800',
  medium: 'text-amber-400 bg-amber-900/30 border-amber-800',
  low:    'text-green-400 bg-green-900/30 border-green-800',
}

const METRIC_LABELS: Record<string, string> = {
  http_errors:                      '4xx / 5xx Errors',
  missing_h1:                       'Missing H1 Tags',
  missing_meta_title:               'Missing Meta Titles',
  duplicate_meta_titles:            'Duplicate Meta Titles',
  missing_meta_description:         'Missing Meta Descriptions',
  duplicate_meta_descriptions:      'Duplicate Meta Descriptions',
  missing_canonical:                'Missing Canonical Tags',
  image_alt_gaps:                   'Images Without Alt Text',
  broken_internal_links:            'Broken Internal Links',
  orphan_pages:                     'Orphan Pages',
  mobile_viewport:                  'Missing Viewport Tag',
  https_check:                       'Non-HTTPS Pages',
  redirect_chains:                  'Redirect Chains',
  multiple_h1_tags:                 'Multiple H1 Tags',
  title_length_issues:              'Title Length Issues',
  meta_description_length_issues:   'Meta Description Length Issues',
  mixed_content:                    'Mixed Content (HTTP/HTTPS)',
  broken_external_links:            'Broken External Links',
  redirect_loops:                   'Redirect Loops',
  hreflang_errors:                  'Hreflang Errors',
  xml_sitemap_issues:               'XML Sitemap Issues',
  schema_markup_errors:             'Schema Markup Errors',
  image_file_size_issues:           'Large Uncompressed Images',
}

function MetricsGrid({ metrics }: { metrics: AuditResult['metrics'] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {Object.entries(METRIC_LABELS).map(([key, label]) => {
        const m = metrics[key as keyof typeof metrics] as { count: number; severity: string; affected_urls?: string[] }
        if (!m) return null
        const isOpen = expanded === key
        const hasUrls = (m.affected_urls ?? []).length > 0

        return (
          <div key={key} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
              onClick={() => hasUrls && setExpanded(isOpen ? null : key)}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_COLOR[m.severity as keyof typeof SEVERITY_COLOR] ?? SEVERITY_COLOR.low}`}>
                  {m.severity}
                </span>
                <span className="text-slate-200 text-sm font-medium">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${m.count > 0 ? 'text-white' : 'text-slate-500'}`}>{m.count}</span>
                {hasUrls && (
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </button>
            {isOpen && hasUrls && (
              <div className="border-t border-slate-700 p-4 space-y-1 bg-slate-900/40">
                <p className="text-xs text-slate-400 mb-2">Affected URLs (showing up to 20)</p>
                {(m.affected_urls ?? []).slice(0, 20).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-brand-400 hover:text-brand-300 truncate hover:underline">
                    {url}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ResultsDisplay({ audit }: Props) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [rewritingPage, setRewritingPage] = useState<string | null>(null)
  const [expandedGEOPage, setExpandedGEOPage] = useState<string | null>(null)
  const ai = audit.ai_recommendations
  const geoScore = audit.metrics.geo_score

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownload() {
    if (!audit.id) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadPdf(audit.id)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
      setTimeout(() => setDownloadError(null), 5000)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-1 transition-colors">
            ← Back to audit
          </Link>
          <h1 className="text-2xl font-bold text-white">{audit.domain}</h1>
          <p className="text-slate-400 text-sm">{audit.pages_crawled} pages crawled · {audit.status}</p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <button onClick={handleCopy}
            className="px-4 py-2 rounded-xl border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
            {copied ? '✓ Copied!' : '🔗 Share'}
          </button>
          <div className="flex flex-col gap-1">
            <button onClick={handleDownload} disabled={!audit.id || downloading}
              className="px-4 py-2 rounded-xl border border-brand-600 bg-brand-900/40 text-brand-300 hover:bg-brand-900/70 text-sm font-medium transition-colors disabled:opacity-40">
              {downloading ? 'Preparing…' : '⬇ PDF'}
            </button>
            {downloadError && (
              <p className="text-xs text-red-400">{downloadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Score */}
      <ScoreCard score={ai?.overall_score ?? 0} summary={ai?.summary} pagespeed={audit.pagespeed} />

      {/* Critical issues */}
      {ai?.critical_issues?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-red-400">⚠</span> Critical Issues
            <span className="text-sm font-normal text-slate-400">ranked by impact</span>
          </h2>
          <div className="space-y-4">
            {ai.critical_issues.slice(0, 5).map(issue => (
              <IssueCard key={issue.rank} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* Quick wins */}
      {ai?.quick_wins?.length > 0 && (
        <section className="rounded-2xl border border-green-800 bg-green-900/20 p-6 space-y-3">
          <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">⚡ Quick Wins</h2>
          <ul className="space-y-2">
            {ai.quick_wins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                {win}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* GEO Score */}
      {geoScore && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">✨</span> GEO Score (LLM Optimization)
          </h2>
          <div className="rounded-xl border border-purple-800 bg-purple-900/20 p-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-purple-300">{geoScore.average}</div>
              <div className="text-slate-400 text-sm">out of 10</div>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              GEO Score measures how well your pages are optimized for citation by generative AI engines
              (ChatGPT, Perplexity, Gemini). Higher scores indicate better LLM-friendliness.
            </p>

            {/* Per-page GEO scores */}
            {geoScore.per_page && geoScore.per_page.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-purple-300 mb-3">Top Pages by GEO Score:</p>
                {geoScore.per_page
                  .sort((a, b) => b.geo_score - a.geo_score)
                  .slice(0, 5)
                  .map((page) => (
                    <div key={page.url} className="rounded-lg bg-slate-800/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <a href={page.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-purple-300 hover:text-purple-200 truncate hover:underline">
                          {page.url}
                        </a>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{page.geo_score}/10</span>
                          <button onClick={() => setExpandedGEOPage(expandedGEOPage === page.url ? null : page.url)}
                            className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300 hover:bg-purple-900">
                            {expandedGEOPage === page.url ? '−' : '+'}
                          </button>
                        </div>
                      </div>
                      {expandedGEOPage === page.url && (
                        <div className="space-y-2 pt-2 border-t border-slate-700">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400">FAQ Schema:</span>
                              <span className={page.geo_signals.faq_schema_present ? 'text-green-400' : 'text-red-400'}>
                                {page.geo_signals.faq_schema_present ? ' ✓ Present' : ' ✗ Missing'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Entity Density:</span>
                              <span className="text-blue-400"> {page.geo_signals.entity_density.toFixed(1)}/100w</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Answer Density:</span>
                              <span className="text-blue-400"> {page.geo_signals.answer_density_score}/5</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Readability:</span>
                              <span className="text-blue-400"> {page.geo_signals.readability_score}/2</span>
                            </div>
                          </div>
                          {page.geo_issues.length > 0 && (
                            <div className="space-y-1 mt-2">
                              <p className="text-slate-400 text-xs">Issues:</p>
                              {page.geo_issues.map((issue, i) => (
                                <p key={i} className="text-xs text-amber-400">• {issue}</p>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => handleRewrite(page.url, page.geo_issues)}
                            disabled={rewritingPage === page.url}
                            className="mt-3 w-full px-3 py-1 rounded text-xs bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50">
                            {rewritingPage === page.url ? 'Rewriting…' : '✨ Rewrite for GEO'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* All 23 metrics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">All Metrics</h2>
        <MetricsGrid metrics={audit.metrics} />
      </section>
    </div>
  )

  async function handleRewrite(pageUrl: string, geoIssues: string[] = []) {
    setRewritingPage(pageUrl)
    try {
      // Fetch page content from the URL
      console.log(`Fetching content from ${pageUrl}`)
      const pageResp = await fetch(pageUrl)
      const pageHtml = await pageResp.text()

      // Extract text content from HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(pageHtml, 'text/html')
      const pageContent = doc.body.innerText.substring(0, 2000) // First 2000 chars

      if (!pageContent || pageContent.length < 50) {
        alert('Failed to fetch page content')
        return
      }

      // Call rewrite API
      const result = await rewriteForGeo(pageUrl, pageContent, geoIssues)

      // Show success with diff summary
      alert(
        `✅ Rewrite Complete!\n\n${result.diff_summary}\n\n` +
          `Rewritten content preview:\n${result.rewritten_content.substring(0, 200)}...`
      )

      // Optional: Log FAQ suggestions if available
      if (result.faq_suggestions && result.faq_suggestions.length > 0) {
        console.log('FAQ Suggestions:', result.faq_suggestions)
      }
    } catch (err) {
      alert(`❌ Rewrite failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('Rewrite error:', err)
    } finally {
      setRewritingPage(null)
    }
  }
}
