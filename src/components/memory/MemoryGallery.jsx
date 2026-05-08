import { useMemo, useState } from 'react'
import { MemoryCard } from './MemoryCard'
import { MemoryEditor } from './MemoryEditor'
import { formatDateLabel, parseTime } from '@/lib/time'

export function MemoryGallery({ pastEvents, onMemorySaved }) {
  const [editingId, setEditingId] = useState(null)
  const [swipeOpenId, setSwipeOpenId] = useState(null)

  // 依日期分組（最新在前）
  const grouped = useMemo(() => {
    const map = new Map()
    for (const ev of pastEvents) {
      const d = parseTime(ev.startTime)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, { dateIso: ev.startTime, items: [] })
      map.get(key).items.push(ev)
    }
    // 反序：較新的日期在上
    return Array.from(map.values()).reverse()
  }, [pastEvents])

  const editingEvent = pastEvents.find(e => e.id === editingId) ?? null

  if (pastEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-sage-green/20 mb-5" />
        <p className="text-graphite font-medium">回憶會在這裡長出來</p>
        <p className="text-sm text-graphite-soft mt-1">完成一段行程後再回來看看。</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {grouped.map((group, idx) => (
        <section key={group.dateIso} className={idx === 0 ? '' : 'mt-8'}>
          <p className="text-xs tracking-widest text-graphite-soft mb-3 px-1">
            {formatDateLabel(group.dateIso)}
          </p>
          <div className="space-y-4">
            {group.items.map(ev => (
              <MemoryCard
                key={ev.id}
                event={ev}
                onOpen={() => setEditingId(ev.id)}
                swipeOpen={swipeOpenId === ev.id}
                onSwipeOpen={setSwipeOpenId}
              />
            ))}
          </div>
        </section>
      ))}

      {editingEvent && (
        <MemoryEditor
          event={editingEvent}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSaved={onMemorySaved}
        />
      )}
    </div>
  )
}
