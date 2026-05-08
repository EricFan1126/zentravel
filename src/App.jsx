import { useState, useEffect, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { TabBar } from '@/components/layout/TabBar'
import { TripList } from '@/components/trip/TripList'
import { Timeline } from '@/components/timeline/Timeline'
import { MemoryGallery } from '@/components/memory/MemoryGallery'
import { CalendarView } from '@/components/calendar/CalendarView'
import { EventEditor } from '@/components/event/EventEditor'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { useNow } from '@/hooks/useNow'
import { useItinerary } from '@/hooks/useItinerary'
import { useAuth } from '@/hooks/useAuth'
import { toDateKey, localDateKey } from '@/lib/time'
import { newTripId } from '@/lib/storage'

export default function App() {
  const { user } = useAuth()

  // 登入狀態確認中
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-cloud-white flex items-center justify-center">
        <p className="text-sm text-graphite-soft">載入中…</p>
      </div>
    )
  }

  // 未登入
  if (user === null) return <LoginScreen />

  // 已登入
  return <AppContent uid={user.uid} />
}

function AppContent({ uid }) {
  const [tab, setTab] = useState('timeline')
  const now = useNow()
  const {
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
  } = useItinerary(uid, now)

  // 處理 URL 邀請碼（?invite=CODE）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('invite')
    if (!code) return
    joinTrip(code).catch(() => {})
    // 清掉 URL 參數，避免重複加入
    const url = new URL(window.location)
    url.searchParams.delete('invite')
    window.history.replaceState({}, '', url)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { user, logout } = useAuth()

  // 選中的旅程
  const [selectedTripId, setSelectedTripId] = useState(null)
  const selectedTrip = trips.find(t => t.id === selectedTripId) ?? null

  // 選中旅程的行程
  const tripEvents = selectedTripId ? eventsByTrip(selectedTripId) : []
  const { current, soon, future, past } = classifyGroups(tripEvents)
  const focusEvent = current[0] ?? soon[0] ?? future[0] ?? null

  // 選中的日期
  const todayKey = localDateKey(now)
  const [selectedDateKey, setSelectedDateKey] = useState(() => localDateKey(new Date()))
  const prevTodayKey = useRef(todayKey)
  useEffect(() => {
    if (todayKey !== prevTodayKey.current) {
      setSelectedDateKey(prev => prev === prevTodayKey.current ? todayKey : prev)
      prevTodayKey.current = todayKey
    }
  }, [todayKey])

  // 編輯狀態
  const [editorState, setEditorState] = useState(null)
  const openCreate = (dateKey) => setEditorState({ event: null, dateKey: dateKey ?? selectedDateKey })
  const openEdit = (event) => setEditorState({ event, dateKey: null })
  const closeEditor = () => setEditorState(null)

  const handleSave = (event) => {
    upsertEvent({ ...event, tripId: selectedTripId })
    const dateKey = toDateKey(event.startTime)
    if (dateKey !== selectedDateKey) setSelectedDateKey(dateKey)
  }

  const handleCalendarDateSelect = (dateKey) => {
    setSelectedDateKey(dateKey)
    setTab('timeline')
  }

  const handleSelectTrip = (trip) => {
    setSelectedTripId(trip.id)
    setSelectedDateKey(trip.startDate ?? todayKey)
  }

  const handleAddTrip = async (form) => {
    const trip = { ...form, id: newTripId() }
    await upsertTrip(trip)
    handleSelectTrip(trip)
  }

  // deleteEvent 現在需要 (eventId, tripId)
  const handleDeleteEvent = (eventId) => {
    const tripId = selectedTripId ?? allEvents.find(e => e.id === eventId)?.tripId
    if (tripId) deleteEvent(eventId, tripId)
  }

  // AppShell 標題
  const getTitle = () => {
    if (tab === 'calendar') return '日期'
    if (tab === 'memory') return '回憶'
    if (tab === 'profile') return '我的'
    if (tab === 'timeline') return selectedTrip ? selectedTrip.name : '行程'
    return ''
  }
  const getSubtitle = () => {
    if (tab === 'calendar') return `${allEvents.length} 段行程`
    if (tab === 'memory') return selectedTrip
      ? `${past.filter(e => !!e.memory).length} 段回憶 · ${selectedTrip.name}`
      : '選擇旅程以查看回憶'
    if (tab === 'profile') return user?.email ?? ''
    if (tab === 'timeline') return selectedTrip
      ? `${selectedTrip.destination}  ·  ${tripEvents.length} 段行程`
      : `共 ${trips.length} 段旅程`
    return ''
  }

  return (
    <>
      <AppShell
        title={getTitle()}
        subtitle={getSubtitle()}
        onBack={tab === 'timeline' && selectedTrip ? () => setSelectedTripId(null) : null}
      >
        {tab === 'calendar' && (
          <CalendarView events={allEvents} onSelectDate={handleCalendarDateSelect} />
        )}
        {tab === 'timeline' && (
          selectedTrip ? (
            <Timeline
              events={tripEvents}
              trip={selectedTrip}
              focusEvent={focusEvent}
              now={now}
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
              onEditEvent={openEdit}
              onDeleteEvent={handleDeleteEvent}
              onCreateEvent={openCreate}
            />
          ) : (
            <TripList
              trips={trips}
              onSelect={handleSelectTrip}
              onAdd={handleAddTrip}
              onUpdate={upsertTrip}
              onDelete={deleteTrip}
              onJoin={joinTrip}
              uid={uid}
            />
          )
        )}
        {tab === 'memory' && (
          selectedTrip ? (
            <MemoryGallery pastEvents={past} onMemorySaved={refreshMemories} />
          ) : (
            <TripList
              trips={trips}
              onSelect={(trip) => setSelectedTripId(trip.id)}
              onAdd={handleAddTrip}
              onUpdate={upsertTrip}
              onDelete={deleteTrip}
              onJoin={joinTrip}
              uid={uid}
            />
          )
        )}
        {tab === 'profile' && (
          <ProfilePage user={user} onLogout={logout} />
        )}
      </AppShell>
      <TabBar active={tab} onChange={(t) => { setTab(t); if (t !== 'timeline') setSelectedTripId(null) }} />

      {editorState && (
        <EventEditor
          event={editorState.event}
          defaultDateKey={editorState.dateKey}
          open={!!editorState}
          onOpenChange={(open) => !open && closeEditor()}
          onSave={handleSave}
          onDelete={handleDeleteEvent}
        />
      )}
    </>
  )
}
