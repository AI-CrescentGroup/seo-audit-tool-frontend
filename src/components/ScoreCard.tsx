'use client'

interface Props {
  score: number
  summary?: string
  pagespeed?: { performance: number; seo: number; accessibility: number; best_practices: number } | null
}

function scoreColor(score: number) {
  if (score >= 70) return { stroke: '#22c55e', text: 'text-green-400', bg: 'bg-green-900/30 border-green-700', label: 'Good' }
  if (score >= 40) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700', label: 'Needs work' }
  return { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-900/30 border-red-700', label: 'Critical' }
}

function CircularScore({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (score / 100) * circumference
  const { stroke, text } = scoreColor(score)

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="68" cy="68" r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${text}`}>{score}</span>
        <span className="text-slate-400 text-xs">/ 100</span>
      </div>
    </div>
  )
}

function PagespeedBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function ScoreCard({ score, summary, pagespeed }: Props) {
  const { bg, text, label } = scoreColor(score)

  return (
    <div className="animate-slide-up">
      <div className={`rounded-2xl border p-6 ${bg} flex flex-col sm:flex-row items-center gap-6`}>
        <CircularScore score={score} />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <div className={`inline-block text-sm font-semibold px-2 py-0.5 rounded-full border ${bg} ${text} mb-1`}>
              {label}
            </div>
            <h2 className="text-2xl font-bold text-white">Overall SEO Score</h2>
          </div>
          {summary && <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>}
        </div>
      </div>

      {pagespeed && (
        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">PageSpeed Insights</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <PagespeedBar label="Performance" value={pagespeed.performance} />
            <PagespeedBar label="SEO" value={pagespeed.seo} />
            <PagespeedBar label="Accessibility" value={pagespeed.accessibility} />
            <PagespeedBar label="Best Practices" value={pagespeed.best_practices} />
          </div>
        </div>
      )}
    </div>
  )
}
