import { Pencil, Trash2, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { SwipeableRow } from '@/components/ui/SwipeableRow'
import { formatTime } from '@/lib/time'
import { getEventType } from '@/lib/eventTypes'

export function MemoryCard({ event, onOpen, onDelete, swipeOpen, onSwipeOpen }) {
  const hasMemory = !!event.memory
  const type = getEventType(event.type)
  const TypeIcon = type.icon

  const actions = [
    {
      label: '編輯',
      icon: <Pencil className="h-4 w-4" />,
      className: 'bg-morandi-blue/15 text-morandi-blue hover:bg-morandi-blue/25',
      onClick: onOpen,
    },
    onDelete && {
      label: '刪除',
      icon: <Trash2 className="h-4 w-4" />,
      className: 'bg-red-50 text-red-400 hover:bg-red-100',
      onClick: () => { if (window.confirm('確定刪除這段回憶？')) onDelete(event.id) },
    },
  ].filter(Boolean)

  return (
    <SwipeableRow
      swipeOpen={swipeOpen}
      onSwipeOpen={(open) => onSwipeOpen(open ? event.id : null)}
      actions={actions}
    >
      <Card
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
        }}
        className="cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:shadow-zen-lg group"
      >
        {hasMemory ? (
          <>
            <div className="aspect-[4/3] overflow-hidden bg-divider/40 relative">
              {event.memory.photo ? (
                <img
                  src={event.memory.photo}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-graphite-soft text-xs">
                  未上傳照片
                </div>
              )}
              <div className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-cloud-white/85 backdrop-blur-sm">
                <TypeIcon className={cn('h-4 w-4', type.color)} aria-label={type.label} />
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs text-graphite-soft tabular-nums">
                <span>{formatTime(event.startTime)}</span>
                <span className="text-graphite-soft/40">·</span>
                <span className="text-[11px] tracking-wider">{type.label}</span>
              </div>
              <h3 className="mt-1 font-medium text-graphite">{event.title}</h3>
              {event.memory.caption && (
                <p className="mt-2 text-sm text-graphite-soft leading-relaxed">
                  「{event.memory.caption}」
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border border-dashed border-divider flex items-center justify-center text-graphite-soft group-hover:border-sage-green/60 group-hover:text-sage-green transition-colors flex-shrink-0">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-graphite-soft tabular-nums">
                <TypeIcon className={cn('h-3.5 w-3.5', type.color)} />
                <span>{formatTime(event.startTime)}</span>
              </div>
              <h3 className="mt-0.5 font-medium text-graphite truncate">{event.title}</h3>
              <p className="mt-0.5 text-xs text-sage-green">＋ 留下這一刻</p>
            </div>
          </div>
        )}
      </Card>
    </SwipeableRow>
  )
}
