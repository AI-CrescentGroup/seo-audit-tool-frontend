'use client'

interface Props {
  pagesCrawled?: number
  step?: 1 | 2 | 3
  domain?: string
}

const STEPS = [
  { n: 1, label: 'Crawling pages' },
  { n: 2, label: 'Analysing SEO' },
  { n: 3, label: 'Generating insights' },
]

export default function LoadingSpinner({ pagesCrawled = 0, step = 1, domain }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 animate-fade-in">
      {/* Spinner rings */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 animate-spin [animation-duration:1.4s]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">🔍</span>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        {domain && (
          <p className="text-slate-400 text-sm">Auditing <span className="text-brand-400 font-medium">{domain}</span></p>
        )}
        <p className="text-white font-semibold text-lg">
          {step === 1 && `Crawling… ${pagesCrawled > 0 ? `${pagesCrawled} pages found` : 'starting crawl'}`}
          {step === 2 && 'Analysing SEO metrics…'}
          {step === 3 && 'Generating AI recommendations…'}
        </p>
        {step === 1 && pagesCrawled > 0 && (
          <p className="text-slate-400 text-sm">Up to 500 pages · this may take 30–60 seconds</p>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = s.n < step
          const active = s.n === step
          return (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${done  ? 'bg-green-900/50 text-green-400 border border-green-700'  : ''}
                ${active ? 'bg-brand-900/60 text-brand-300 border border-brand-600 animate-pulse-slow' : ''}
                ${!done && !active ? 'bg-slate-800 text-slate-500 border border-slate-700' : ''}
              `}>
                <span>{done ? '✓' : s.n}</span>
                <span>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px ${done ? 'bg-green-600' : 'bg-slate-700'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
