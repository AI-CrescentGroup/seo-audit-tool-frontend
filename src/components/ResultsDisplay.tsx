'use client'

import { useState } from 'react'
import { AuditResult, downloadPdf, rewriteForGeo } from '@/utils/api'
import ScoreCard from './ScoreCard'
import IssueCard from './IssueCard'
import Link from 'next/link'
import { GSCDashboard } from './GSCDashboard'
import { GSCConnect } from './GSCConnect'

interface Props {
  audit: AuditResult
}

const SEVERITY_COLOR = {
  high:   'text-red-400 bg-red-900/30 border-red-800',
  medium: 'text-amber-400 bg-amber-900/30 border-amber-800',
  low:    'text-green-400 bg-green-900/30 border-green-800',
}

const METRIC_GROUPS: { label: string; icon: string; keys: string[] }[] = [
  {
    label: 'Crawlability & Errors',
    icon: '🔍',
    keys: ['http_errors', 'noindex_pages', 'orphan_pages'],
  },
  {
    label: 'Headings & Structure',
    icon: '📐',
    keys: ['missing_h1', 'multiple_h1_tags', 'heading_hierarchy'],
  },
  {
    label: 'Meta & Titles',
    icon: '🏷️',
    keys: [
      'missing_meta_title', 'duplicate_meta_titles', 'title_length_issues',
      'missing_meta_description', 'duplicate_meta_descriptions',
      'meta_description_length_issues', 'missing_canonical',
    ],
  },
  {
    label: 'Social & Schema',
    icon: '🔗',
    keys: ['open_graph_tags', 'twitter_card_tags', 'faq_schema', 'breadcrumb_schema', 'schema_markup_errors'],
  },
  {
    label: 'Links & Redirects',
    icon: '↩️',
    keys: ['broken_internal_links', 'broken_external_links', 'redirect_chains', 'redirect_loops', 'redirect_status_codes'],
  },
  {
    label: 'Images',
    icon: '🖼️',
    keys: ['image_alt_gaps', 'image_file_size_issues', 'image_dimensions', 'image_file_names'],
  },
  {
    label: 'Technical SEO',
    icon: '⚙️',
    keys: ['mobile_viewport', 'https_check', 'mixed_content', 'hreflang_errors', 'xml_sitemap_issues'],
  },
  {
    label: 'Content Quality',
    icon: '📝',
    keys: ['word_count', 'content_to_code_ratio', 'url_length'],
  },
]

const METRIC_LABELS: Record<string, string> = {
  http_errors:                      '4xx / 5xx Errors',
  noindex_pages:                    'Accidental Noindex Pages',
  orphan_pages:                     'Orphan Pages',
  missing_h1:                       'Missing H1 Tags',
  multiple_h1_tags:                 'Multiple H1 Tags',
  heading_hierarchy:                'Broken Heading Hierarchy',
  missing_meta_title:               'Missing Meta Titles',
  duplicate_meta_titles:            'Duplicate Meta Titles',
  title_length_issues:              'Title Length Issues',
  missing_meta_description:         'Missing Meta Descriptions',
  duplicate_meta_descriptions:      'Duplicate Meta Descriptions',
  meta_description_length_issues:   'Meta Description Length Issues',
  missing_canonical:                'Missing Canonical Tags',
  open_graph_tags:                  'Missing Open Graph Tags',
  twitter_card_tags:                'Missing Twitter Card Tags',
  faq_schema:                       'Pages Without FAQ Schema',
  breadcrumb_schema:                'Pages Without Breadcrumb Schema',
  schema_markup_errors:             'Schema Markup Errors',
  broken_internal_links:            'Broken Internal Links',
  broken_external_links:            'Broken External Links',
  redirect_chains:                  'Redirect Chains',
  redirect_loops:                   'Redirect Loops',
  redirect_status_codes:            'Temporary Redirects (302/307)',
  image_alt_gaps:                   'Images Without Alt Text',
  image_file_size_issues:           'Large Uncompressed Images',
  image_dimensions:                 'Images Missing Width/Height',
  image_file_names:                 'Generic Image Filenames',
  mobile_viewport:                  'Missing Viewport Tag',
  https_check:                      'Non-HTTPS Pages',
  mixed_content:                    'Mixed Content (HTTP/HTTPS)',
  hreflang_errors:                  'Hreflang Errors',
  xml_sitemap_issues:               'XML Sitemap Issues',
  word_count:                       'Thin Content (< 300 words)',
  content_to_code_ratio:            'Low Content-to-Code Ratio',
  url_length:                       'URLs Over 75 Characters',
}

function MetricRow({
  metricKey,
  label,
  m,
  expanded,
  onToggle,
}: {
  metricKey: string
  label: string
  m: { count: number; severity: string; affected_urls?: string[] }
  expanded: boolean
  onToggle: () => void
}) {
  const hasUrls = (m.affected_urls ?? []).length > 0
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
        onClick={() => hasUrls && onToggle()}
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
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      {expanded && hasUrls && (
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
}

function MetricsGrid({ metrics }: { metrics: AuditResult['metrics'] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  function toggleGroup(groupLabel: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(groupLabel) ? next.delete(groupLabel) : next.add(groupLabel)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {METRIC_GROUPS.map(group => {
        const groupMetrics = group.keys
          .map(key => ({ key, label: METRIC_LABELS[key], m: metrics[key as keyof typeof metrics] as { count: number; severity: string; affected_urls?: string[] } | undefined }))
          .filter(({ m }) => m !== undefined)

        if (groupMetrics.length === 0) return null

        const issueCount = groupMetrics.reduce((sum, { m }) => sum + (m?.count ?? 0), 0)
        const highCount = groupMetrics.filter(({ m }) => m?.severity === 'high' && (m?.count ?? 0) > 0).length
        const isCollapsed = collapsedGroups.has(group.label)

        return (
          <div key={group.label} className="rounded-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => toggleGroup(group.label)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/80 hover:bg-slate-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{group.icon}</span>
                <span className="text-white font-semibold">{group.label}</span>
                <span className="text-xs text-slate-400">{groupMetrics.length} checks</span>
                {highCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-red-400 bg-red-900/30 border-red-800">
                    {highCount} high
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {issueCount > 0 && (
                  <span className="text-sm font-bold text-white">{issueCount} issues</span>
                )}
                {issueCount === 0 && (
                  <span className="text-sm text-green-400 font-medium">✓ Clean</span>
                )}
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-4 space-y-3 bg-slate-900/20">
                {groupMetrics.map(({ key, label, m }) => m && (
                  <MetricRow
                    key={key}
                    metricKey={key}
                    label={label}
                    m={m}
                    expanded={expanded === key}
                    onToggle={() => setExpanded(expanded === key ? null : key)}
                  />
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
        <div className="flex gap-2 flex-col sm:flex-row items-end">
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
          <GSCConnect />
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

      {/* Google Search Console */}
      {audit.gsc_metrics && (
        <section className="rounded-2xl border border-blue-800 bg-blue-900/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">🔎</span> Google Search Console
            </h2>
            <span className="text-xs bg-blue-900/50 border border-blue-800 px-2 py-1 rounded text-blue-300">
              Last 30 days
            </span>
          </div>
          <GSCDashboard
            gscMetrics={audit.gsc_metrics}
            geoScores={
              audit.metrics?.geo_score?.per_page?.map((p: any) => ({
                url: p.url,
                geo_score: p.geo_score
              })) || []
            }
          />
        </section>
      )}

      {/* All 35 metrics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">All Metrics</h2>
        <MetricsGrid metrics={audit.metrics} />
      </section>
    </div>
  )

  async function handleRewrite(pageUrl: string, geoIssues: string[] = []) {
    setRewritingPage(pageUrl)
    try {
      // Backend fetches page content server-side (avoids CORS)
      const result = await rewriteForGeo(pageUrl, '', geoIssues)

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
