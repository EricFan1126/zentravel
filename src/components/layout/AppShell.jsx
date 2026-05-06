import { ChevronLeft } from 'lucide-react'

export function AppShell({ title, subtitle, onBack, rightAction, children }) {
  return (
    <div className="min-h-full bg-cloud-white">
      <div className="max-w-md mx-auto px-5 pt-12 pb-28">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-sm text-graphite-soft hover:text-graphite transition-colors mb-3 -ml-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  所有旅程
                </button>
              )}
              <h1 className="text-3xl font-medium text-graphite tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-graphite-soft">{subtitle}</p>
              )}
            </div>
            {rightAction && (
              <div className="shrink-0 mt-1">{rightAction}</div>
            )}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
