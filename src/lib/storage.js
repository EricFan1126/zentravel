// localStorage 包裝。
// - zentravel:trips      => Trip[]（旅程列表）
// - zentravel:itinerary  => Event[]（行程主資料，可新增/編輯/刪除）
// - zentravel:memories   => { [eventId]: Memory }（行程結束後的回憶）

const TRIP_KEY = 'zentravel:trips'
const ITIN_KEY = 'zentravel:itinerary'
const MEM_KEY  = 'zentravel:memories'
const SEED_KEY = 'zentravel:seeded-v3'

function safeParse(raw, fallback) {
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

// ───── Trip CRUD ─────

export function loadTrips() {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(TRIP_KEY), [])
}

export function saveTrips(trips) {
  window.localStorage.setItem(TRIP_KEY, JSON.stringify(trips))
}

export function upsertTrip(trip) {
  const all = loadTrips()
  const idx = all.findIndex(t => t.id === trip.id)
  if (idx >= 0) all[idx] = trip
  else all.push(trip)
  saveTrips(all)
  return trip
}

export function deleteTrip(id) {
  saveTrips(loadTrips().filter(t => t.id !== id))
  // 同步刪除該旅程下的所有行程及回憶
  const events = loadItinerary().filter(e => e.tripId !== id)
  saveItinerary(events)
  const mems = loadMemories()
  let changed = false
  for (const e of loadItinerary()) {
    if (mems[e.id]) { delete mems[e.id]; changed = true }
  }
  if (changed) window.localStorage.setItem(MEM_KEY, JSON.stringify(mems))
}

export function newTripId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return `trip-${crypto.randomUUID().slice(0, 8)}`
  return `trip-${Date.now().toString(36)}`
}

// ───── Itinerary CRUD ─────

export function loadItinerary() {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(ITIN_KEY), [])
}

export function saveItinerary(events) {
  window.localStorage.setItem(ITIN_KEY, JSON.stringify(events))
}

export function upsertEvent(event) {
  const all = loadItinerary()
  const idx = all.findIndex(e => e.id === event.id)
  if (idx >= 0) all[idx] = event
  else all.push(event)
  saveItinerary(all)
  return event
}

export function deleteEvent(id) {
  saveItinerary(loadItinerary().filter(e => e.id !== id))
  const mems = loadMemories()
  if (mems[id]) {
    delete mems[id]
    window.localStorage.setItem(MEM_KEY, JSON.stringify(mems))
  }
}

export function seedIfEmpty(seedTrip, seedEvents) {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(SEED_KEY) === '1') return
  saveTrips([seedTrip])
  saveItinerary(seedEvents)
  window.localStorage.setItem(SEED_KEY, '1')
}

export function newEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return `evt-${crypto.randomUUID().slice(0, 8)}`
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ───── Memory CRUD ─────

export function loadMemories() {
  if (typeof window === 'undefined') return {}
  return safeParse(window.localStorage.getItem(MEM_KEY), {})
}

export function saveMemories(mem) {
  window.localStorage.setItem(MEM_KEY, JSON.stringify(mem))
}

export function saveMemory(eventId, { photo, caption }) {
  const all = loadMemories()
  all[eventId] = { photo: photo ?? null, caption: caption ?? '', savedAt: new Date().toISOString() }
  window.localStorage.setItem(MEM_KEY, JSON.stringify(all))
  return all[eventId]
}

export function deleteMemory(eventId) {
  const all = loadMemories()
  delete all[eventId]
  window.localStorage.setItem(MEM_KEY, JSON.stringify(all))
}

// ───── File helpers ─────

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
