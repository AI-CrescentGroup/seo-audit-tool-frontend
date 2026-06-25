'use client'

import { useEffect, useState } from 'react'

interface GSCStatus {
  connected: boolean
  connected_at?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function GSCConnect() {
  const [status, setStatus] = useState<GSCStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gsc/status`)
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch GSC status:', err)
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gsc/auth`)
      const { auth_url } = await res.json()
      if (auth_url) {
        window.location.href = auth_url
      }
    } catch (err) {
      alert(`Failed to start GSC connection: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="gsc-connect loading">
        <p className="text-slate-400 text-sm">Loading Google Search Console status...</p>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="gsc-connect error">
        <p className="text-red-400 text-sm">Failed to load GSC status</p>
      </div>
    )
  }

  return (
    <div className="gsc-connect">
      {status.connected ? (
        <div className="connected-badge">
          <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Google Search Console Connected
          </span>
          {status.connected_at && (
            <span className="text-slate-500 text-xs mt-1">
              Since {new Date(status.connected_at).toLocaleDateString()}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="connect-button px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          🔗 Connect Google Search Console
        </button>
      )}
    </div>
  )
}
