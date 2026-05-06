// 時間相關 helpers — 全部以 Date 為主，避免引入 dayjs/date-fns 等套件，保持輕量。
// 行程時間統一以 +08:00 (台北/北京/香港/新加坡) 為基準存放。

const HOUR = 60 * 60 * 1000
const SOON_WINDOW_MS = 3 * HOUR // 「即將開始」視為 3 小時內的未來
export const DEFAULT_TZ_OFFSET = '+08:00'

// '2026-05-05T15:00:00+08:00' → '2026-05-05T15:00'（給 <input type="datetime-local"> 用）
export function toInputValue(iso) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

// '2026-05-05T15:00' → '2026-05-05T15:00:00+08:00'
export function fromInputValue(local, offset = DEFAULT_TZ_OFFSET) {
  if (!local) return ''
  return `${local}:00${offset}`
}

// '2026-05-05T15:00:00+08:00' → '2026-05-05'（單純取日期 key）
export function toDateKey(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

// Date 物件 → 'YYYY-MM-DD'（用裝置本地時區，避免 toISOString 的 UTC 偏移問題）
export function localDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseTime(iso) {
  return new Date(iso)
}

// 把單筆 event 跟 now 比較，回傳分群 status
export function classifyEvent(event, now) {
  const start = parseTime(event.startTime).getTime()
  const end = parseTime(event.endTime).getTime()
  const t = now.getTime()
  if (t >= start && t < end) return 'current'
  if (t < start && start - t <= SOON_WINDOW_MS) return 'soon'
  if (t < start) return 'future'
  return 'past'
}

// HH:mm
export function formatTime(iso) {
  const d = parseTime(iso)
  return d.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// MM/DD（週X）
export function formatDateLabel(iso) {
  const d = parseTime(iso)
  const md = d.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${md.replace(/\//g, '.')} 週${w}`
}

// 相對時間：「再 25 分鐘」「已過 3 小時」
export function formatRelative(iso, now) {
  const diff = parseTime(iso).getTime() - now.getTime()
  const absMin = Math.round(Math.abs(diff) / (60 * 1000))
  if (absMin < 1) return diff >= 0 ? '即將' : '剛才'
  if (absMin < 60) return diff > 0 ? `再 ${absMin} 分鐘` : `${absMin} 分鐘前`
  const absHr = Math.round(absMin / 60)
  if (absHr < 24) return diff > 0 ? `再 ${absHr} 小時` : `${absHr} 小時前`
  const absDay = Math.round(absHr / 24)
  return diff > 0 ? `再 ${absDay} 天` : `${absDay} 天前`
}

// 把同一天的事件群組化
export function groupByDate(events) {
  const map = new Map()
  for (const ev of events) {
    const d = parseTime(ev.startTime)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!map.has(key)) map.set(key, { dateIso: ev.startTime, events: [] })
    map.get(key).events.push(ev)
  }
  return Array.from(map.values())
}
