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
  const url = `${BASE}/api/audit/${id}/pdf`
  const a = document.createElement('a')
  a.href = url
  a.download = `seo-audit-${id}.pdf`
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
