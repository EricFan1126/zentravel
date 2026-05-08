import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, formatRelative } from '@/lib/time'
import { Card } from '@/components/ui/card'
import { SwipeableRow } from '@/components/ui/SwipeableRow'
import { getEventType } from '@/lib/eventTypes'

// status: 'current' | 'soon' | 'future' | 'past'
export function TimelineCard({ event, expanded, onToggle, onEdit, onDelete, now, swipeOpen, onSwipeOpen }) {
  const isFocus = event.status === 'current' || event.status === 'soon'
  const isPast = event.status === 'past'
  const type = getEventType(event.type)
  const TypeIcon = type.icon

  const actions = [
    onEdit && {
      label: '編輯',
      icon: <Pencil className="h-4 w-4" />,
      className: 'bg-morandi-blue/15 text-morandi-blue hover:bg-morandi-blue/25',
      onClick: () => onEdit(event),
    },
    onDelete && {
      label: '刪除',
      icon: <Trash2 className="h-4 w-4" />,
      className: 'bg-red-50 text-red-400 hover:bg-red-100',
      onClick: () => { if (window.confirm('確定刪除這段行程？')) onDelete(event.id) },
    },
  ].filter(Boolean)

  return (
    <SwipeableRow
      swipeOpen={swipeOpen}
      onSwipeOpen={(open) => onSwipeOpen(open ? event.id : null)}
      actions={actions}
    >
      <Card
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
        }}
        className={cn(
          'cursor-pointer overflow-hidden transition-shadow duration-300 ease-out',
          'hover:shadow-zen-lg',
          isFocus && 'ring-1 ring-morandi-blue/40 shadow-zen-lg',
          isPast && 'opacity-60',
        )}
      >
        <div className="p-5">
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

          <div className="flex items-center gap-2.5 text-sm text-graphite-soft tabular-nums">
            <TypeIcon className={cn('h-4 w-4 flex-shrink-0', type.color)} aria-label={type.label} />
            <span>{formatTime(event.startTime)} — {formatTime(event.endTime)}</span>
            <span className="text-graphite-soft/40">·</span>
            <span className="text-[11px] tracking-wider">{type.label}</span>
          </div>

          <h3 className={cn(
            'mt-1 font-medium text-graphite leading-snug',
            isFocus ? 'text-2xl' : 'text-lg',
          )}>
            {event.title}
          </h3>

          {event.location && (
            <p className="mt-1 text-sm text-graphite-soft">{event.location}</p>
          )}

          {event.note && (
            <p className="mt-3 text-xs text-morandi-blue tracking-wide">
              ▸ {event.note}
            </p>
          )}

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
                {(() => {
                  const links = event.links?.length
                    ? event.links
                    : event.mapUrl ? [{ label: 'Google Maps', url: event.mapUrl }] : []
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
                  ) : null
                })()}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </SwipeableRow>
  )
}
