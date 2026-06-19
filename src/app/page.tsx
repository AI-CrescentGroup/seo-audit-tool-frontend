import AuditForm from '@/components/AuditForm'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-semibold">Crescent Group</span>
          </div>
          <a
            href="/results"
            className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block"
          >
            Past audits →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-fade-in space-y-6 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-700 bg-brand-900/30 text-brand-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            AI-Powered · 23 Metrics · Instant Report
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-white">
            SEO Intelligence Audit Tool
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Comprehensive website audits in seconds. Crawl your site, detect critical SEO issues,
            and get AI-generated fixes — all in one report.
          </p>

          <AuditForm />
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-slate-800 px-6 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🔍', label: 'Deep Crawl', desc: 'Up to 500 pages' },
            { icon: '📊', label: '23 Metrics', desc: 'Full SEO coverage' },
            { icon: '🤖', label: 'AI Analysis', desc: 'Intelligent insights' },
            { icon: '⚡', label: 'Instant', desc: 'Results in ~60s' },
          ].map(f => (
            <div key={f.label} className="space-y-1">
              <div className="text-2xl">{f.icon}</div>
              <div className="text-white font-semibold text-sm">{f.label}</div>
              <div className="text-slate-500 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
