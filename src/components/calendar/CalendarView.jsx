import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDateKey } from '@/lib/time'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function CalendarView({ events, onSelectDate }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedKey, setSelectedKey] = useState(null)

  const todayKey = toDateKey(today.toISOString().slice(0, 10) + 'T00:00:00+08:00')

  // 有行程的日期 set
  const eventDateSet = new Set(events.map(e => toDateKey(e.startTime)))

  const days = buildCalendarDays(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(day) {
    if (!day) return
    const key = dateKey(viewYear, viewMonth, day)
    setSelectedKey(key)
    onSelectDate(key)
  }

  return (
    <div className="px-5 pt-4">
      {/* 月份導覽 */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-full hover:bg-divider/40 transition-colors text-graphite-soft"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-medium text-graphite tabular-nums">
          {viewYear} 年 {viewMonth + 1} 月
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-full hover:bg-divider/40 transition-colors text-graphite-soft"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 週標題 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              'text-center text-xs font-medium py-1 tracking-wider',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-morandi-blue' : 'text-graphite-soft',
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const key = dateKey(viewYear, viewMonth, day)
          const isToday = key === todayKey
          const isSelected = key === selectedKey
          const hasEvent = eventDateSet.has(key)
          const isSun = idx % 7 === 0
          const isSat = idx % 7 === 6

          return (
            <button
              key={key}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center py-1 gap-0.5 rounded-xl transition-colors hover:bg-divider/30"
            >
              <span
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-full text-sm tabular-nums transition-colors',
                  isSelected && 'bg-graphite text-cloud-white',
                  !isSelected && isToday && 'bg-morandi-blue/20 text-morandi-blue font-medium',
                  !isSelected && !isToday && isSun && 'text-red-400',
                  !isSelected && !isToday && isSat && 'text-morandi-blue',
                  !isSelected && !isToday && !isSun && !isSat && 'text-graphite',
                )}
              >
                {day}
              </span>
              {/* 有行程的小點 */}
              <span
                className={cn(
                  'h-1 w-1 rounded-full transition-opacity',
                  hasEvent ? 'opacity-100' : 'opacity-0',
                  isSelected ? 'bg-cloud-white' : 'bg-morandi-blue',
                )}
              />
            </button>
          )
        })}
      </div>

      {/* 提示文字 */}
      <p className="mt-6 text-center text-xs text-graphite-soft/60">
        點擊日期，跳到對應行程
      </p>
    </div>
  )
}
