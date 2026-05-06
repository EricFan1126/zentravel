import { formatTime } from '@/lib/time'

export function CurrentTimeBar({ now }) {
  const iso = now.toISOString()
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-morandi-blue/30" />
      <span className="text-xs font-medium tracking-wider text-morandi-blue tabular-nums">
        現在 {formatTime(iso)}
      </span>
      <div className="h-px flex-1 bg-morandi-blue/30" />
    </div>
  )
}
