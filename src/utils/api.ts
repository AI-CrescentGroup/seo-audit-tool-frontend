const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ── types ──────────────────────────────────────────────────────────────────

export interface CriticalIssue {
  rank: number
  issue: string
  why_it_matters: string
  fix: string
  priority_score: number
  estimated_impact: string
}

export interface AIRecommendations {
  overall_score: number
  summary: string
  critical_issues: CriticalIssue[]
  quick_wins: string[]
  raw_response?: string
}

export interface MetricDetail {
  count: number
  severity: 'high' | 'medium' | 'low'
  affected_urls: string[]
  [key: string]: unknown
}

export interface GEOSignals {
  faq_schema_present: boolean
  entity_density: number
  answer_density_score: number
  heading_structure_score: number
  content_freshness_score: number
  readability_score: number
}

export interface GEOPageScore {
  url: string
  geo_score: number
  geo_signals: GEOSignals
  geo_issues: string[]
}

export interface GSCMetrics {
  domain: string
  date_range: string
  site_totals: {
    impressions: number
    clicks: number
    ctr: number
    avg_position: number
  }
  per_url: Record<string, {
    impressions: number
    clicks: number
    ctr: number
    position: number
  }>
}

export interface AuditMetrics {
  pages_crawled: number
  http_errors: MetricDetail
  missing_h1: MetricDetail
  missing_meta_title: MetricDetail
  duplicate_meta_titles: MetricDetail
  missing_meta_description: MetricDetail
  duplicate_meta_descriptions: MetricDetail
  missing_canonical: MetricDetail
  image_alt_gaps: MetricDetail
  broken_internal_links: MetricDetail
  orphan_pages: MetricDetail
  mobile_viewport: MetricDetail & { all_pages_have_viewport?: boolean }
  https_check: MetricDetail & { https_percentage?: number }
  redirect_chains: MetricDetail
  multiple_h1_tags: MetricDetail
  title_length_issues: MetricDetail
  meta_description_length_issues: MetricDetail
  mixed_content: MetricDetail
  broken_external_links: MetricDetail & { broken_links?: unknown[] }
  redirect_loops: MetricDetail & { loops?: unknown[] }
  hreflang_errors: MetricDetail
  xml_sitemap_issues: MetricDetail & { issues?: unknown[] }
  schema_markup_errors: MetricDetail
  image_file_size_issues: MetricDetail & { large_images?: unknown[] }
  geo_score?: { average: number; per_page: GEOPageScore[] }
}

export interface AuditResult {
  id: string | null
  domain: string
  status: 'completed' | 'cached' | 'processing' | 'error'
  pages_crawled: number
  metrics: AuditMetrics
  pagespeed: {
    performance: number
    seo: number
    accessibility: number
    best_practices: number
  } | null
  ai_recommendations: AIRecommendations
  gsc_metrics?: GSCMetrics
}

// ── helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── public API ─────────────────────────────────────────────────────────────

/** POST /api/audit/{domain} — run a new audit or return cached */
export async function auditDomain(domain: string): Promise<AuditResult> {
  // Strip protocol if user typed it
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return apiFetch<AuditResult>(`/api/audit/${clean}`, { method: 'POST' })
}

/** GET /api/audit/{id} — fetch a stored audit by UUID */
export async function getAudit(id: string): Promise<AuditResult> {
  return apiFetch<AuditResult>(`/api/audit/${id}`)
}

/** GET /api/audits — list recent audits */
export async function listAudits(limit = 10): Promise<AuditResult[]> {
  return apiFetch<AuditResult[]>(`/api/audits?limit=${limit}`)
}

/** Trigger browser download of the PDF report */
export async function downloadPdf(id: string): Promise<void> {
  try {
    const url = `${BASE}/api/audit/${id}/pdf`
    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`PDF download failed: ${response.status} — ${error}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `seo-audit-${id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Clean up the blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to download PDF')
  }
}

/** Rewrite page content for GEO (Generative Engine Optimization) */
export async function rewriteForGeo(
  url: string,
  currentContent: string,
  geoIssues: string[] = []
): Promise<{
  url: string
  original_content: string
  rewritten_content: string
  diff_summary: string
  faq_suggestions?: Array<{ question: string; answer: string }>
}> {
  return apiFetch<{
    url: string
    original_content: string
    rewritten_content: string
    diff_summary: string
    faq_suggestions?: Array<{ question: string; answer: string }>
  }>(`/api/rewrite-for-geo`, {
    method: 'POST',
    body: JSON.stringify({ url, current_content: currentContent, geo_issues: geoIssues }),
  })
}
