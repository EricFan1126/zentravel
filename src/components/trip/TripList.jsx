import { useState } from 'react'
import { Plus, MapPin, CalendarDays, Trash2, UserPlus, LogIn, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SwipeableRow } from '@/components/ui/SwipeableRow'
import { InviteModal } from './InviteModal'
import { MemberAvatars } from './MemberAvatars'
import { cn } from '@/lib/utils'

const EMOJIS = ['✈️', '🗼', '🏖️', '🏔️', '🌸', '🍜', '🎌', '🗺️', '🌏', '🏯']

function TripEditForm({ trip, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: trip.name ?? '',
    destination: trip.destination ?? '',
    startDate: trip.startDate ?? '',
    endDate: trip.endDate ?? '',
    coverEmoji: trip.coverEmoji ?? '✈️',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return setError('請填入旅程名稱')
    if (!form.startDate || !form.endDate) return setError('請選擇日期區間')
    if (form.endDate < form.startDate) return setError('結束日期需晚於開始日期')
    onSave({ ...trip, ...form, name: form.name.trim(), destination: form.destination.trim() })
  }

  return (
    <div className="mt-3 pt-3 border-t border-divider/60 animate-fade-in space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map(e => (
          <button
            key={e}
            onClick={() => set('coverEmoji', e)}
            className={cn(
              'w-8 h-8 rounded-lg text-base transition-colors',
              form.coverEmoji === e ? 'bg-graphite/10 ring-1 ring-graphite/20' : 'hover:bg-divider/40',
            )}
          >{e}</button>
        ))}
      </div>
      <input
        value={form.name}
        onChange={e => set('name', e.target.value)}
        placeholder="旅程名稱"
        className="w-full bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite placeholder:text-graphite-soft/50 focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
      />
      <input
        value={form.destination}
        onChange={e => set('destination', e.target.value)}
        placeholder="目的地"
        className="w-full bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite placeholder:text-graphite-soft/50 focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
      />
      <div className="space-y-2">
        <div>
          <label className="text-xs text-graphite-soft mb-1 block">開始日期</label>
          <input
            type="date"
            value={form.startDate}
            onChange={e => set('startDate', e.target.value)}
            className="w-full box-border appearance-none bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
          />
        </div>
        <div>
          <label className="text-xs text-graphite-soft mb-1 block">結束日期</label>
          <input
            type="date"
            value={form.endDate}
            onChange={e => set('endDate', e.target.value)}
            className="w-full box-border appearance-none bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>取消</Button>
        <Button size="sm" onClick={handleSave}>儲存</Button>
      </div>
    </div>
  )
}

export function TripList({ trips, onSelect, onAdd, onUpdate, onDelete, onJoin, uid }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '', coverEmoji: '✈️' })
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [inviteTrip, setInviteTrip] = useState(null)
  const [swipeOpenId, setSwipeOpenId] = useState(null)

  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleAdd = () => {
    if (!form.name.trim()) return setError('請填入旅程名稱')
    if (!form.startDate || !form.endDate) return setError('請選擇日期區間')
    if (form.endDate < form.startDate) return setError('結束日期需晚於開始日期')
    onAdd({ ...form, name: form.name.trim(), destination: form.destination.trim() })
    setForm({ name: '', destination: '', startDate: '', endDate: '', coverEmoji: '✈️' })
    setError('')
    setShowForm(false)
  }

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return setJoinError('請輸入邀請碼')
    setJoinLoading(true)
    setJoinError('')
    try {
      await onJoin(code)
      setShowJoin(false)
      setJoinCode('')
    } catch (e) {
      setJoinError(e.message ?? '加入失敗，請確認邀請碼是否正確')
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div className="px-0 animate-fade-in">
      <div className="space-y-4">
        {trips.map(trip => {
          const isOwner = !trip.sharedFrom
          const actions = [
            isOwner && {
              label: '成員',
              icon: <UserPlus className="h-4 w-4" />,
              className: 'bg-sage-green/15 text-sage-green hover:bg-sage-green/25',
              onClick: () => setInviteTrip(trip),
            },
            isOwner && {
              label: '編輯',
              icon: <Pencil className="h-4 w-4" />,
              className: 'bg-morandi-blue/15 text-morandi-blue hover:bg-morandi-blue/25',
              onClick: () => setEditingId(editingId === trip.id ? null : trip.id),
            },
            {
              label: isOwner ? '刪除' : '退出',
              icon: <Trash2 className="h-4 w-4" />,
              className: 'bg-red-50 text-red-400 hover:bg-red-100',
              onClick: () => {
                const msg = isOwner ? `確定刪除「${trip.name}」及所有行程？` : `確定退出「${trip.name}」？`
                if (window.confirm(msg)) onDelete(trip.id)
              },
            },
          ].filter(Boolean)

          return (
            <SwipeableRow
              key={trip.id}
              swipeOpen={swipeOpenId === trip.id}
              onSwipeOpen={(open) => setSwipeOpenId(open ? trip.id : null)}
              actions={actions}
            >
              <Card className="transition-shadow duration-200 overflow-hidden cursor-pointer hover:shadow-zen-lg">
                <div className="p-5">
                  <div
                    className="flex items-start gap-4"
                    onClick={() => onSelect(trip)}
                  >
                    <span className="text-3xl leading-none mt-0.5">{trip.coverEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-graphite leading-snug truncate">{trip.name}</h3>
                      {trip.destination && (
                        <p className="mt-0.5 text-sm text-graphite-soft flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {trip.destination}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-graphite-soft/70 flex items-center gap-1 tabular-nums">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {trip.startDate} — {trip.endDate}
                      </p>
                      <MemberAvatars trip={trip} />
                    </div>
                  </div>

                  {editingId === trip.id && (
                    <TripEditForm
                      trip={trip}
                      onSave={(updated) => { onUpdate(updated); setEditingId(null) }}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              </Card>
            </SwipeableRow>
          )
        })}
      </div>

      {showForm ? (
        <Card className="mt-4 p-5 animate-fade-in-up">
          <h3 className="text-sm font-medium text-graphite mb-4">新增旅程</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => set('coverEmoji', e)}
                className={cn(
                  'w-9 h-9 rounded-xl text-lg transition-colors',
                  form.coverEmoji === e ? 'bg-graphite/10 ring-1 ring-graphite/20' : 'hover:bg-divider/40',
                )}
              >{e}</button>
            ))}
          </div>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="旅程名稱（如：東京初春）"
              className="w-full bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite placeholder:text-graphite-soft/50 focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
            />
            <input
              value={form.destination}
              onChange={e => set('destination', e.target.value)}
              placeholder="目的地（如：日本東京）"
              className="w-full bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite placeholder:text-graphite-soft/50 focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
            />
            <div className="space-y-2">
              <div>
                <label className="text-xs text-graphite-soft mb-1 block">開始日期</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                  className="w-full box-border appearance-none bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
                />
              </div>
              <div>
                <label className="text-xs text-graphite-soft mb-1 block">結束日期</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                  className="w-full box-border appearance-none bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
                />
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError('') }}>取消</Button>
            <Button size="sm" onClick={handleAdd}>建立旅程</Button>
          </div>
        </Card>
      ) : showJoin ? (
        <Card className="mt-4 p-5 animate-fade-in-up">
          <h3 className="text-sm font-medium text-graphite mb-4">輸入邀請碼</h3>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="例：A3B7K2"
            maxLength={6}
            className="w-full bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite tracking-widest placeholder:text-graphite-soft/50 focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
          />
          {joinError && <p className="mt-2 text-xs text-red-400">{joinError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError('') }}>取消</Button>
            <Button size="sm" onClick={handleJoin} disabled={joinLoading}>
              {joinLoading ? '加入中…' : '加入旅程'}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 py-4 rounded-2xl border border-dashed border-divider text-sm text-graphite-soft hover:border-morandi-blue/40 hover:text-morandi-blue transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            新增旅程
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 py-4 rounded-2xl border border-dashed border-divider text-sm text-graphite-soft hover:border-sage-green/50 hover:text-sage-green transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            加入旅程
          </button>
        </div>
      )}

      <InviteModal
        open={!!inviteTrip}
        onOpenChange={(open) => !open && setInviteTrip(null)}
        trip={inviteTrip}
        uid={uid}
      />
    </div>
  )
}
