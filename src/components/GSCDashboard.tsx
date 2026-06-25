'use client'

import { useState, useMemo } from 'react'

interface GeoScore {
  url: string
  geo_score: number
}

interface GSCMetrics {
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

export function GSCDashboard({
  gscMetrics,
  geoScores = []
}: {
  gscMetrics?: GSCMetrics
  geoScores?: GeoScore[]
}) {
  const [sortBy, setSortBy] = useState<'clicks' | 'impressions' | 'ctr' | 'position'>('clicks')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  if (!gscMetrics) {
    return (
      <div className="gsc-empty space-y-4 text-center py-8">
        <p className="text-slate-400 text-sm">
          No Google Search Console data. Connect your account to see search performance metrics.
        </p>
      </div>
    )
  }

  const { site_totals, per_url, date_range } = gscMetrics

  // Build geo score lookup
  const geoLookup = useMemo(() => {
    const lookup: Record<string, number> = {}
    geoScores.forEach(s => {
      lookup[s.url] = s.geo_score
    })
    return lookup
  }, [geoScores])

  // Sort URLs
  const sortedUrls = useMemo(() => {
    const entries = Object.entries(per_url)
    entries.sort((a, b) => {
      const aVal = a[1][sortBy]
      const bVal = b[1][sortBy]
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
    return entries
  }, [per_url, sortBy, sortDir])

  // Analyze signals
  const getSignal = (url: string, data: typeof per_url[keyof typeof per_url]) => {
    const geoScore = geoLookup[url]
    if (!geoScore) return null

    if (data.ctr < 3 && geoScore > 6) {
      return 'Low CTR, high GEO — improve meta titles'
    }
    if (data.impressions > 1000 && geoScore < 4) {
      return 'High impressions, low GEO — rewrite content'
    }
    if (data.position > 20 && geoScore > 7) {
      return 'Great content, poor ranking — check backlinks'
    }
    return null
  }

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  return (
    <div className="gsc-dashboard space-y-6">
      {/* Site Totals */}
      <div className="gsc-totals grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-medium">Total Impressions</div>
          <div className="text-white text-2xl font-bold mt-2">
            {site_totals.impressions.toLocaleString()}
          </div>
        </div>
        <div className="stat-card bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-medium">Total Clicks</div>
          <div className="text-white text-2xl font-bold mt-2">
            {site_totals.clicks.toLocaleString()}
          </div>
        </div>
        <div className="stat-card bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-medium">Avg CTR</div>
          <div className="text-white text-2xl font-bold mt-2">{site_totals.ctr}%</div>
        </div>
        <div className="stat-card bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-medium">Avg Position</div>
          <div className="text-white text-2xl font-bold mt-2">{site_totals.avg_position}</div>
        </div>
      </div>

      <p className="text-slate-500 text-xs">Data: {date_range}</p>

      {/* Per-URL Table */}
      <div className="gsc-table-wrapper overflow-x-auto">
        <table className="gsc-table w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-3 py-2 text-slate-300 font-semibold">URL</th>
              <th
                onClick={() => handleSort('impressions')}
                className="text-right px-3 py-2 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                Impressions {sortBy === 'impressions' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('clicks')}
                className="text-right px-3 py-2 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                Clicks {sortBy === 'clicks' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('ctr')}
                className="text-right px-3 py-2 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                CTR % {sortBy === 'ctr' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('position')}
                className="text-right px-3 py-2 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                Position {sortBy === 'position' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-center px-3 py-2 text-slate-300 font-semibold">GEO</th>
              <th className="text-left px-3 py-2 text-slate-300 font-semibold">Signal</th>
            </tr>
          </thead>
          <tbody>
            {sortedUrls.slice(0, 100).map(([url, data]) => {
              const geoScore = geoLookup[url]
              const signal = getSignal(url, data)
              const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')

              return (
                <tr key={url} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-3 py-2 text-slate-300 text-xs truncate max-w-xs" title={url}>
                    {displayUrl}
                  </td>
                  <td className="text-right px-3 py-2 text-slate-200">{data.impressions.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 text-slate-200">{data.clicks.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 text-slate-200">{data.ctr}%</td>
                  <td className="text-right px-3 py-2 text-slate-200">{data.position}</td>
                  <td className="text-center px-3 py-2">
                    {geoScore ? (
                      <span className={geoScore >= 6 ? 'text-green-400' : geoScore >= 4 ? 'text-yellow-400' : 'text-red-400'}>
                        {geoScore}/10
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {signal ? (
                      <span className="text-xs text-orange-400 bg-orange-900/20 px-2 py-1 rounded">
                        {signal}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sortedUrls.length > 100 && (
        <p className="text-slate-500 text-xs text-center">
          Showing top 100 of {sortedUrls.length} URLs
        </p>
      )}
    </div>
  )
}
