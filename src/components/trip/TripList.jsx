import { useState } from 'react'
import { Plus, MapPin, CalendarDays, Trash2, UserPlus, LogIn, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

export function TripList({ trips, onSelect, onAdd, onUpdate, onDelete, onJoin, uid, editMode, onToggleEditMode }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '', coverEmoji: '✈️' })
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [inviteTrip, setInviteTrip] = useState(null)

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

  const handleExitEdit = () => {
    setEditingId(null)
    setDeletingId(null)
    onToggleEditMode()
  }

  return (
    <div className="px-0 animate-fade-in">
      <div className="space-y-4">
        {trips.map(trip => {
          const isOwner = !trip.sharedFrom
          return (
            <Card
              key={trip.id}
              className={cn(
                'transition-all duration-200 overflow-hidden',
                !editMode && 'cursor-pointer hover:shadow-zen-lg',
                editMode && isOwner && 'ring-1 ring-morandi-blue/20',
              )}
            >
              {deletingId === trip.id ? (
                <div className="p-5 flex items-center justify-between">
                  <span className="text-sm text-graphite-soft">確定刪除「{trip.name}」及所有行程？</span>
                  <div className="flex gap-3 ml-3 shrink-0">
                    <button onClick={() => setDeletingId(null)} className="text-xs text-graphite-soft hover:text-graphite transition-colors">取消</button>
                    <button onClick={() => { onDelete(trip.id); setDeletingId(null) }} className="text-xs text-red-400 hover:text-red-500 transition-colors">確定刪除</button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div
                    className="flex items-start gap-4"
                    onClick={() => !editMode && onSelect(trip)}
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

                    {/* 編輯模式下顯示操作按鈕 */}
                    {editMode && isOwner && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setInviteTrip(trip) }}
                          className="p-1.5 text-graphite-soft/50 hover:text-morandi-blue transition-colors"
                          title="邀請成員"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(editingId === trip.id ? null : trip.id) }}
                          className={cn(
                            'p-1.5 transition-colors',
                            editingId === trip.id ? 'text-morandi-blue' : 'text-graphite-soft/50 hover:text-morandi-blue',
                          )}
                          title="編輯旅程"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingId(trip.id) }}
                          className="p-1.5 text-graphite-soft/50 hover:text-red-400 transition-colors"
                          title="刪除旅程"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 行內編輯表單 */}
                  {editMode && editingId === trip.id && (
                    <TripEditForm
                      trip={trip}
                      onSave={(updated) => { onUpdate(updated); setEditingId(null) }}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* 新增旅程表單 */}
      {!editMode && (
        showForm ? (
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
        )
      )}

      {/* 編輯模式下的完成按鈕 */}
      {editMode && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleExitEdit}
            className="px-6 py-2.5 rounded-full bg-graphite/6 text-sm text-graphite-soft hover:bg-graphite/10 transition-colors"
          >
            完成編輯
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
