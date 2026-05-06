import { useState } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, formatRelative } from '@/lib/time'
import { Card } from '@/components/ui/card'
import { getEventType } from '@/lib/eventTypes'

// status: 'current' | 'soon' | 'future' | 'past'
export function TimelineCard({ event, expanded, onToggle, onEdit, onDelete, now }) {
  const isFocus = event.status === 'current' || event.status === 'soon'
  const isPast = event.status === 'past'
  const [confirming, setConfirming] = useState(false)
  const type = getEventType(event.type)
  const TypeIcon = type.icon

  return (
    <Card
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'cursor-pointer overflow-hidden transition-all duration-300 ease-out',
        'hover:shadow-zen-lg',
        isFocus && 'ring-1 ring-morandi-blue/40 shadow-zen-lg',
        isPast && 'opacity-60',
      )}
    >
      <div className="p-5">
        {/* 狀態標 */}
        {event.status === 'current' && (
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-green opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-green" />
            </span>
            <span className="text-xs font-medium text-sage-green tracking-wide">進行中</span>
          </div>
        )}
        {event.status === 'soon' && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-morandi-blue tracking-wide">
              即將開始 · {formatRelative(event.startTime, now)}
            </span>
          </div>
        )}

        {/* 標題列：圖示 + 時間 + 類型 label */}
        <div className="flex items-center gap-2.5 text-sm text-graphite-soft tabular-nums">
          <TypeIcon className={cn('h-4 w-4 flex-shrink-0', type.color)} aria-label={type.label} />
          <span>{formatTime(event.startTime)} — {formatTime(event.endTime)}</span>
          <span className="text-graphite-soft/40">·</span>
          <span className="text-[11px] tracking-wider">{type.label}</span>
        </div>

        {/* 標題 */}
        <h3 className={cn(
          'mt-1 font-medium text-graphite leading-snug',
          isFocus ? 'text-2xl' : 'text-lg',
        )}>
          {event.title}
        </h3>

        {/* 地點 */}
        {event.location && (
          <p className="mt-1 text-sm text-graphite-soft">{event.location}</p>
        )}

        {/* 關鍵備註 */}
        {event.note && (
          <p className="mt-3 text-xs text-morandi-blue tracking-wide">
            ▸ {event.note}
          </p>
        )}

        {/* 展開區 — 同卡片高度動畫 */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            expanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-divider/70 pt-4 space-y-3">
              {event.details && (
                <p className="text-sm leading-relaxed text-graphite-soft whitespace-pre-line">
                  {event.details}
                </p>
              )}
              {confirming ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between pt-1"
                >
                  <span className="text-xs text-graphite-soft">確定刪除這段行程？</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="text-xs text-graphite-soft hover:text-graphite transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(event.id)}
                      className="text-xs text-red-400 hover:text-red-500 transition-colors"
                    >
                      確定刪除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  {(() => {
                    const links = event.links?.length
                      ? event.links
                      : event.mapUrl
                        ? [{ label: 'Google Maps', url: event.mapUrl }]
                        : []
                    return links.length ? (
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        {links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-morandi-blue hover:text-morandi-blue/80 transition-colors"
                          >
                            {link.label || '連結'}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ))}
                      </div>
                    ) : <span />
                  })()}
                  <div className="flex items-center gap-3">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(event)
                        }}
                        className="inline-flex items-center gap-1 text-xs text-graphite-soft hover:text-graphite transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        編輯
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirming(true)
                        }}
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        刪除
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
