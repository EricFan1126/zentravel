import { useRef } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime, formatRelative } from '@/lib/time'
import { Card } from '@/components/ui/card'
import { getEventType } from '@/lib/eventTypes'

const ACTION_WIDTH = 140 // px，兩個按鈕合計寬度
const THRESHOLD = 60    // 超過此距離才展開

// status: 'current' | 'soon' | 'future' | 'past'
export function TimelineCard({ event, expanded, onToggle, onEdit, onDelete, now, swipeOpen, onSwipeOpen }) {
  const isFocus = event.status === 'current' || event.status === 'soon'
  const isPast = event.status === 'past'
  const type = getEventType(event.type)
  const TypeIcon = type.icon

  const touchStart = useRef(null)
  const isDragging = useRef(false)

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX
    isDragging.current = false
  }

  const handleTouchMove = (e) => {
    if (touchStart.current === null) return
    if (Math.abs(e.touches[0].clientX - touchStart.current) > 8) isDragging.current = true
  }

  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    if (dx < -THRESHOLD && !swipeOpen) { onSwipeOpen(event.id); return }
    if (dx > THRESHOLD && swipeOpen) { onSwipeOpen(null); return }
  }

  const handleCardClick = () => {
    if (isDragging.current) return
    if (swipeOpen) { onSwipeOpen(null); return }
    onToggle()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onSwipeOpen(null)
    if (window.confirm('確定刪除這段行程？')) onDelete(event.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onSwipeOpen(null)
    onEdit(event)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* 底層：編輯 / 刪除按鈕（右側） */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: ACTION_WIDTH }}
        aria-hidden="true"
      >
        {onEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-morandi-blue/15 text-morandi-blue hover:bg-morandi-blue/25 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs font-medium">編輯</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs font-medium">刪除</span>
          </button>
        )}
      </div>

      {/* 上層：卡片本體，左滑時向左移動 */}
      <div
        style={{
          transform: swipeOpen ? `translateX(-${ACTION_WIDTH}px)` : 'translateX(0)',
          transition: 'transform 0.25s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card
          onClick={handleCardClick}
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

            {/* 展開區 */}
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
      </div>
    </div>
  )
}
