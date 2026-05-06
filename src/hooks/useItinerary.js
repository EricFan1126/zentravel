import { useEffect, useMemo, useState } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  getDocs, writeBatch, getDoc,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { sampleTrip, sampleItinerary } from '@/data/sampleItinerary'
import { classifyEvent, parseTime } from '@/lib/time'
import { newTripId, newEventId, loadMemories, saveMemories } from '@/lib/storage'
import { acceptInvite } from '@/lib/invite'

function ownerMember() {
  const u = auth.currentUser
  return {
    role: 'owner',
    displayName: u?.displayName ?? '我',
    photoURL: u?.photoURL ?? null,
    joinedAt: Date.now(),
  }
}

async function seedIfEmpty(uid) {
  const tripsRef = collection(db, 'users', uid, 'trips')
  const snap = await getDocs(tripsRef)
  if (!snap.empty) return
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', uid, 'trips', sampleTrip.id), {
    ...sampleTrip,
    ownerId: uid,
    members: { [uid]: ownerMember() },
  })
  for (const ev of sampleItinerary) {
    batch.set(doc(db, 'users', uid, 'trips', sampleTrip.id, 'events', ev.id), ev)
  }
  await batch.commit()
}

export function useItinerary(uid, now) {
  const [trips, setTrips] = useState([])
  const [eventsByTripId, setEventsByTripId] = useState({})
  const [memories, setMemories] = useState(() => loadMemories())
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!uid || seeded) return
    seedIfEmpty(uid).then(async () => {
      // 補齊舊旅程：確保 owner 自己在 members 裡
      const snap = await getDocs(collection(db, 'users', uid, 'trips'))
      const batch = writeBatch(db)
      let patched = false
      snap.docs.forEach(d => {
        const data = d.data()
        if (!data.sharedFrom && !data.members?.[uid]) {
          batch.update(d.ref, { [`members.${uid}`]: ownerMember() })
          patched = true
        }
      })
      if (patched) await batch.commit()
      setSeeded(true)
    })
  }, [uid, seeded])

  // 監聽自己的旅程列表
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(collection(db, 'users', uid, 'trips'), async snap => {
      // 每筆 trip doc 可能是自己建的，或是別人分享的（有 sharedFrom）
      const list = await Promise.all(snap.docs.map(async d => {
        const data = { id: d.id, ...d.data() }
        // sharedFrom 存在且指向別人才算共享旅程；指向自己代表資料錯誤，當成自己的旅程
        if (data.sharedFrom && data.sharedFrom !== uid) {
          // 去原擁有者那裡取完整旅程資料
          const ownerTripSnap = await getDoc(doc(db, 'users', data.sharedFrom, 'trips', d.id))
          if (ownerTripSnap.exists()) {
            return {
              ...ownerTripSnap.data(),
              id: d.id,
              role: data.role,
              sharedFrom: data.sharedFrom,
              ownerId: data.sharedFrom,
            }
          }
        }
        // 自己的旅程：確保移除 sharedFrom，避免被誤判為共享
        const { sharedFrom: _sf, ...rest } = data
        return { ...rest, ownerId: uid }
      }))
      list.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
      setTrips(list)
    })
    return unsub
  }, [uid])

  // 監聽所有旅程的行程（自己的走自己路徑，共享的走 owner 路徑）
  useEffect(() => {
    if (!uid || trips.length === 0) return
    const unsubs = trips.map(trip => {
      const ownerId = trip.sharedFrom ?? uid
      return onSnapshot(
        collection(db, 'users', ownerId, 'trips', trip.id, 'events'),
        snap => {
          const evs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          setEventsByTripId(prev => ({ ...prev, [trip.id]: evs }))
        }
      )
    })
    return () => unsubs.forEach(u => u())
  }, [uid, trips.map(t => t.id).join(',')])

  const allEvents = useMemo(() => {
    const all = Object.values(eventsByTripId).flat()
    const sorted = [...all].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
    return sorted.map(ev => ({
      ...ev,
      status: classifyEvent(ev, now),
      memory: memories[ev.id] ?? null,
    }))
  }, [eventsByTripId, memories, now])

  const eventsByTrip = (tripId) => allEvents.filter(e => e.tripId === tripId)

  const classifyGroups = (events) => {
    const groups = { current: [], soon: [], future: [], past: [] }
    for (const ev of events) groups[ev.status].push(ev)
    return groups
  }

  // Trip CRUD（只有 owner 能操作）
  const upsertTrip = async (trip) => {
    const id = trip.id ?? newTripId()
    const existing = trips.find(t => t.id === id)
    const members = { ...(existing?.members ?? {}), [uid]: ownerMember() }
    await setDoc(doc(db, 'users', uid, 'trips', id), { ...trip, id, ownerId: uid, members })
    return { ...trip, id }
  }

  const deleteTrip = async (tripId) => {
    const trip = trips.find(t => t.id === tripId)
    if (trip?.sharedFrom) {
      // 被邀請者只是退出，不刪除原始旅程
      await deleteDoc(doc(db, 'users', uid, 'trips', tripId))
      return
    }
    const evSnap = await getDocs(collection(db, 'users', uid, 'trips', tripId, 'events'))
    const batch = writeBatch(db)
    evSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(doc(db, 'users', uid, 'trips', tripId))
    await batch.commit()
    const mem = loadMemories()
    evSnap.docs.forEach(d => delete mem[d.id])
    saveMemories(mem)
    setMemories({ ...mem })
  }

  // Event CRUD（寫入 owner 的路徑）
  const upsertEvent = async (event) => {
    const id = event.id ?? newEventId()
    const tripId = event.tripId
    const trip = trips.find(t => t.id === tripId)
    const ownerId = trip?.sharedFrom ?? uid
    await setDoc(doc(db, 'users', ownerId, 'trips', tripId, 'events', id), { ...event, id })
  }

  const deleteEvent = async (eventId, tripId) => {
    const trip = trips.find(t => t.id === tripId)
    const ownerId = trip?.sharedFrom ?? uid
    await deleteDoc(doc(db, 'users', ownerId, 'trips', tripId, 'events', eventId))
    const mem = loadMemories()
    delete mem[eventId]
    saveMemories(mem)
    setMemories({ ...mem })
  }

  const refreshMemories = () => setMemories(loadMemories())

  const joinTrip = async (code) => {
    const { tripId, role, ownerId } = await acceptInvite(code, uid)
    // 在自己的 trips 下建立一個指向原旅程的參照（僅存 sharedFrom + role）
    await setDoc(doc(db, 'users', uid, 'trips', tripId), {
      id: tripId,
      sharedFrom: ownerId,
      ownerId,
      role,
    })
  }

  return {
    trips,
    allEvents,
    eventsByTrip,
    classifyGroups,
    upsertTrip,
    deleteTrip,
    upsertEvent,
    deleteEvent,
    refreshMemories,
    joinTrip,
  }
}
