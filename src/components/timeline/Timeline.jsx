import { useMemo, useState } from 'react'
import { TimelineCard } from './TimelineCard'
import { CurrentTimeBar } from './CurrentTimeBar'
import { DateStrip } from './DateStrip'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toDateKey, formatDateLabel } from '@/lib/time'

// 主時間軸
// - 今天：焦點卡 + 剩餘 future + 已過（折疊）
// - 其他日期：純按時間排序
export function Timeline({
  events,
  trip,
  focusEvent,
  now,
  selectedDateKey,
  onSelectDate,
  onEditEvent,
  onDeleteEvent,
  onCreateEvent,
}) {
  const todayKey = toDateKey(now.toISOString())
  const isToday = selectedDateKey === todayKey

  const dayEvents = useMemo(
    () => events.filter(e => toDateKey(e.startTime) === selectedDateKey),
    [events, selectedDateKey],
  )

  const [expandedId, setExpandedId] = useState(focusEvent?.id ?? null)
  const toggle = (id) => setExpandedId(prev => (prev === id ? null : id))

  // 今天分區
  const todayFocus = isToday && focusEvent && toDateKey(focusEvent.startTime) === todayKey
    ? focusEvent
    : null
  const todayUpcoming = isToday
    ? dayEvents.filter(
      e => (e.status === 'future' || e.status === 'soon' || e.status === 'current')
        && e.id !== todayFocus?.id,
    )
    : []
  const todayPast = isToday ? dayEvents.filter(e => e.status === 'past') : []

  // 其他日期：直接全部按時間排
  const otherDayEvents = !isToday ? dayEvents : []

  const [showPast, setShowPast] = useState(false)

  return (
    <div>
      {/* 日期切換 */}
      <DateStrip
        events={events}
        trip={trip}
        now={now}
        selectedDateKey={selectedDateKey}
        onSelect={onSelectDate}
      />

      {/* 當日標籤 + 新增 */}
      <div className="mt-6 mb-4 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-graphite tracking-wide">
          {formatDateLabel(`${selectedDateKey}T00:00:00+08:00`)}
          <span className="ml-2 text-xs text-graphite-soft font-normal">
            {dayEvents.length} 段
          </span>
        </h2>
        <Button
          variant="soft"
          size="sm"
          onClick={() => onCreateEvent(selectedDateKey)}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          新增
        </Button>
      </div>

      {dayEvents.length === 0 ? (
        <EmptyState onAdd={() => onCreateEvent(selectedDateKey)} isToday={isToday} />
      ) : (
        <div className="animate-fade-in">
          {/* 今天：焦點卡 */}
          {todayFocus && (
            <section className="mb-6">
              <p className="text-xs tracking-widest text-graphite-soft uppercase mb-3 px-1">
                Next
              </p>
              <TimelineCard
                event={todayFocus}
                expanded={expandedId === todayFocus.id}
                onToggle={() => toggle(todayFocus.id)}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                now={now}
              />
            </section>
          )}

          {/* 今天：現在時間 bar */}
          {isToday && todayFocus && todayUpcoming.length > 0 && <CurrentTimeBar now={now} />}

          {/* 今天：剩餘未來 */}
          {isToday && todayUpcoming.length > 0 && (
            <div className="mt-4 space-y-4">
              {todayUpcoming.map(ev => (
                <TimelineCard
                  key={ev.id}
                  event={ev}
                  expanded={expandedId === ev.id}
                  onToggle={() => toggle(ev.id)}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  now={now}
                />
              ))}
            </div>
          )}

          {/* 今天：過往折疊 */}
          {isToday && todayPast.length > 0 && (
            <section className="mt-8">
              <button
                onClick={() => setShowPast(v => !v)}
                className="w-full text-xs tracking-wider text-graphite-soft hover:text-graphite transition-colors py-2"
              >
                {showPast ? '收起今日已過' : `今日已過 ${todayPast.length} 段`}
              </button>
              {showPast && (
                <div className="mt-3 space-y-4 animate-fade-in">
                  {todayPast.map(ev => (
                    <TimelineCard
                      key={ev.id}
                      event={ev}
                      expanded={expandedId === ev.id}
                      onToggle={() => toggle(ev.id)}
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                      now={now}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 其他日期：純列表 */}
          {!isToday && otherDayEvents.length > 0 && (
            <div className="space-y-4">
              {otherDayEvents.map(ev => (
                <TimelineCard
                  key={ev.id}
                  event={ev}
                  expanded={expandedId === ev.id}
                  onToggle={() => toggle(ev.id)}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  now={now}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onAdd, isToday }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-morandi-blue/15 mb-5" />
      <p className="text-graphite font-medium">
        {isToday ? '今天還沒有行程' : '這天還沒有行程'}
      </p>
      <p className="text-sm text-graphite-soft mt-1 mb-6">空白也是一種旅程。</p>
      <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
        <Plus className="h-3.5 w-3.5" />
        新增第一段
      </Button>
    </div>
  )
}
