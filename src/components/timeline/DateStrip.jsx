import { useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toDateKey } from '@/lib/time'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function shiftDateKey(key, days) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

// 從旅程日期區間產生每一天，union 有行程的日期
function buildDateKeys(events, trip, todayKey) {
  const set = new Set(events.map(e => toDateKey(e.startTime)))
  if (trip?.startDate && trip?.endDate) {
    let cur = trip.startDate
    while (cur <= trip.endDate) {
      set.add(cur)
      cur = shiftDateKey(cur, 1)
    }
  } else {
    // 沒有旅程資訊時，至少顯示今天前後各 1 天
    set.add(todayKey)
    set.add(shiftDateKey(todayKey, -1))
    set.add(shiftDateKey(todayKey, +1))
  }
  return Array.from(set).sort()
}

function parseKey(key) {
  // 用 noon 避免時區問題
  return new Date(`${key}T12:00:00`)
}

export function DateStrip({ events, trip, now, selectedDateKey, onSelect }) {
  const todayKey = toDateKey(now.toISOString())
  const dateKeys = useMemo(() => buildDateKeys(events, trip, todayKey), [events, trip, todayKey])
  const eventCounts = useMemo(() => {
    const m = new Map()
    for (const ev of events) {
      const k = toDateKey(ev.startTime)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [events])

  const scrollRef = useRef(null)
  const activeRef = useRef(null)

  // 切換日期或第一次掛載時，把選中的 pill 滾到視野中央
  useEffect(() => {
    const node = activeRef.current
    const container = scrollRef.current
    if (node && container) {
      const offset = node.offsetLeft - container.clientWidth / 2 + node.clientWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [selectedDateKey])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-zen -mx-5 px-5 pb-1"
      role="tablist"
      aria-label="行程日期"
    >
      {dateKeys.map(key => {
        const d = parseKey(key)
        const isToday = key === todayKey
        const isActive = key === selectedDateKey
        const count = eventCounts.get(key) ?? 0

        return (
          <button
            key={key}
            ref={isActive ? activeRef : null}
            onClick={() => onSelect(key)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'flex-shrink-0 flex flex-col items-center justify-center min-w-[52px] h-16 rounded-2xl border transition-all duration-200',
              isActive
                ? 'bg-graphite text-cloud-white border-graphite shadow-zen'
                : 'bg-cloud-white text-graphite-soft border-divider/70 hover:border-morandi-blue/40 hover:text-graphite',
            )}
          >
            <span className={cn(
              'text-[10px] tracking-wider',
              isActive ? 'text-cloud-white/70' : isToday ? 'text-morandi-blue' : 'text-graphite-soft/70',
            )}>
              {isToday ? '今天' : `週${WEEK[d.getDay()]}`}
            </span>
            <span className="text-base font-medium tabular-nums leading-tight">
              {d.getDate()}
            </span>
            <span className={cn(
              'inline-block w-1 h-1 rounded-full mt-1',
              count > 0
                ? (isActive ? 'bg-cloud-white/60' : 'bg-morandi-blue/60')
                : 'bg-transparent',
            )} />
          </button>
        )
      })}
    </div>
  )
}
