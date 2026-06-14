'use client'

import { CriticalIssue } from '@/utils/api'

interface Props {
  issue: CriticalIssue
}

const RANK_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
]

const PRIORITY_COLOR = (score: number) =>
  score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-green-500'

export default function IssueCard({ issue }: Props) {
  const rankColor = RANK_COLORS[(issue.rank - 1) % RANK_COLORS.length]
  const isCodeFix = issue.fix.includes('<') || issue.fix.includes('{') || issue.fix.startsWith('1.')

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 overflow-hidden animate-slide-up hover:border-slate-500 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 pb-4">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${rankColor} flex items-center justify-center text-white font-bold text-sm`}>
          {issue.rank}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base leading-tight">{issue.issue}</h3>
          {issue.estimated_impact && (
            <span className="inline-block mt-1 text-xs text-green-400 bg-green-900/40 border border-green-800 rounded-full px-2 py-0.5">
              {issue.estimated_impact}
            </span>
          )}
        </div>
        {/* Priority score */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-slate-400 mb-1">Priority</div>
          <div className="text-lg font-bold text-white">{issue.priority_score}</div>
        </div>
      </div>

      {/* Priority bar */}
      <div className="px-5 pb-4">
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${PRIORITY_COLOR(issue.priority_score)}`}
            style={{ width: `${issue.priority_score}%` }}
          />
        </div>
      </div>

      {/* Why it matters */}
      <div className="px-5 pb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Why it matters</p>
        <p className="text-slate-300 text-sm leading-relaxed">{issue.why_it_matters}</p>
      </div>

      {/* Fix */}
      <div className="px-5 pb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">How to fix</p>
        {isCodeFix ? (
          <pre className="text-xs text-green-300 bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {issue.fix}
          </pre>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed">{issue.fix}</p>
        )}
      </div>
    </div>
  )
}
