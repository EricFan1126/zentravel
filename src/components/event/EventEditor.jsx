import { useEffect, useRef, useState } from 'react'
import * as Portal from '@radix-ui/react-portal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EVENT_TYPES } from '@/lib/eventTypes'
import { toInputValue, fromInputValue } from '@/lib/time'
import { newEventId } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { Paperclip, X, FileText, Link2 } from 'lucide-react'

const EMPTY = {
  id: null,
  type: 'sightseeing',
  title: '',
  location: '',
  note: '',
  details: '',
  linkKlook: '',
  linkMaps: '',
  extraLinks: [],
  startTime: '',
  endTime: '',
  attachments: [],
}

// 壓縮圖片到最大 800px、品質 0.75，回傳 base64
function compressImage(file) {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

async function fileToAttachment(file) {
  const isImage = file.type.startsWith('image/')
  if (isImage) {
    const data = await compressImage(file)
    return { name: file.name, type: 'image', data }
  }
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve({ name: file.name, type: 'file', data: e.target.result })
    reader.readAsDataURL(file)
  })
}

// 把 Event 物件 → 表單可用的 state
function toFormState(event) {
  if (!event) return { ...EMPTY }
  const allLinks = event.links ?? (event.mapUrl ? [{ label: 'Google Maps', url: event.mapUrl }] : [])
  const klookLink = allLinks.find(l => l.label?.toLowerCase().includes('klook'))
  const mapsLink = allLinks.find(l => l.label?.toLowerCase().includes('maps') || l.label?.toLowerCase().includes('google'))
  const extraLinks = allLinks.filter(l => l !== klookLink && l !== mapsLink)
  return {
    id: event.id,
    type: event.type ?? 'other',
    title: event.title ?? '',
    location: event.location ?? '',
    note: event.note ?? '',
    details: event.details ?? '',
    linkKlook: klookLink?.url ?? '',
    linkMaps: mapsLink?.url ?? '',
    extraLinks,
    startTime: toInputValue(event.startTime),
    endTime: toInputValue(event.endTime),
    attachments: event.attachments ?? [],
  }
}

export function EventEditor({ event, defaultDateKey, open, onOpenChange, onSave, onDelete }) {
  const isEditing = !!event
  const [form, setForm] = useState(() => toFormState(event))
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      const initial = toFormState(event)
      if (!event && defaultDateKey) {
        initial.startTime = `${defaultDateKey}T09:00`
        initial.endTime = `${defaultDateKey}T10:00`
      }
      setForm(initial)
      setError('')
      setLightbox(null)
    }
  }, [open, event, defaultDateKey])

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = () => {
    if (!form.title.trim()) return setError('行程標題不能空白')
    if (!form.startTime || !form.endTime) return setError('請填入開始與結束時間')
    if (form.endTime <= form.startTime) return setError('結束時間需晚於開始時間')

    const links = [
      form.linkKlook.trim() && { label: 'Klook', url: form.linkKlook.trim() },
      form.linkMaps.trim() && { label: 'Google Maps', url: form.linkMaps.trim() },
      ...form.extraLinks.filter(l => l.url.trim()),
    ].filter(Boolean)

    const payload = {
      id: form.id ?? newEventId(),
      type: form.type,
      title: form.title.trim(),
      location: form.location.trim(),
      note: form.note.trim(),
      details: form.details.trim(),
      links,
      startTime: fromInputValue(form.startTime),
      endTime: fromInputValue(form.endTime),
      attachments: form.attachments,
    }
    onSave(payload)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!isEditing) return
    if (!window.confirm('確定要刪除這個行程？回憶也會一併移除。')) return
    onDelete(form.id)
    onOpenChange(false)
  }

  return (
    <>
      {/* Lightbox — 掛在 body 最頂層，不受 Dialog z-index 影響 */}
      {lightbox && (
        <Portal.Root>
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center"
            style={{ zIndex: 99999 }}
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox.data}
              alt={lightbox.name}
              className="max-w-full max-h-full object-contain rounded-xl p-4"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </Portal.Root>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? '編輯行程' : '新增行程'}</DialogTitle>
            <DialogDescription>
              收合卡只會顯示「時間 / 地點 / 關鍵備註」三件事
            </DialogDescription>
          </DialogHeader>

          {/* 類型 chips */}
          <Field label="類型">
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(t => {
                const Icon = t.icon
                const active = form.type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('type', t.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors',
                      active
                        ? 'bg-graphite text-cloud-white'
                        : 'bg-divider/40 text-graphite-soft hover:bg-divider/60',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* 標題 */}
          <Field label="標題" required>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="例如：明治神宮散策"
            />
          </Field>

          {/* 地點 */}
          <Field label="地點">
            <Input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="例如：澀谷區代代木神園町"
            />
          </Field>

          {/* 時間 */}
          <Field label="開始" required>
            <Input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
          </Field>
          <Field label="結束" required>
            <Input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
            />
          </Field>

          {/* 關鍵備註 */}
          <Field label="關鍵備註" hint="會顯示在收合卡上（如預約碼、月台號）">
            <Input
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="例如：預約碼 ABC-123"
            />
          </Field>

          {/* 細節 */}
          <Field label="細節" hint="點擊卡片展開後才顯示">
            <Textarea
              value={form.details}
              onChange={(e) => set('details', e.target.value)}
              rows={3}
              placeholder="完整描述、提醒、心得⋯"
            />
          </Field>

          {/* 連結 */}
          <Field label="連結">
            <div className="space-y-2">
              {/* 固定兩欄：Klook + Google Maps */}
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-graphite-soft">Klook</span>
                <Input
                  type="url"
                  value={form.linkKlook}
                  onChange={(e) => set('linkKlook', e.target.value)}
                  placeholder="https://www.klook.com/..."
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-graphite-soft">Google Maps</span>
                <Input
                  type="url"
                  value={form.linkMaps}
                  onChange={(e) => set('linkMaps', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* 額外連結（動態新增） */}
              {form.extraLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...form.extraLinks]
                      next[i] = { ...next[i], label: e.target.value }
                      set('extraLinks', next)
                    }}
                    placeholder="名稱"
                    className="w-24 shrink-0 box-border appearance-none bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite placeholder:text-graphite-soft/50 focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
                  />
                  <Input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const next = [...form.extraLinks]
                      next[i] = { ...next[i], url: e.target.value }
                      set('extraLinks', next)
                    }}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => set('extraLinks', form.extraLinks.filter((_, j) => j !== i))}
                    className="p-1.5 text-graphite-soft/40 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => set('extraLinks', [...form.extraLinks, { label: '', url: '' }])}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-divider text-sm text-graphite-soft hover:border-morandi-blue/40 hover:text-morandi-blue transition-colors w-full justify-center"
              >
                <Link2 className="h-4 w-4" />
                新增其他連結
              </button>
            </div>
          </Field>

          {/* 附檔 */}
          <Field label="附檔" hint="點圖片可全螢幕查看">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files)
                if (!files.length) return
                setUploading(true)
                try {
                  const newAtts = await Promise.all(files.map(fileToAttachment))
                  set('attachments', [...form.attachments, ...newAtts])
                } finally {
                  setUploading(false)
                  e.target.value = ''
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-divider text-sm text-graphite-soft hover:border-morandi-blue/40 hover:text-morandi-blue transition-colors w-full justify-center"
            >
              <Paperclip className="h-4 w-4" />
              {uploading ? '處理中…' : '新增附檔'}
            </button>
            {form.attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {form.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-graphite/4 border border-divider/60">
                    {att.type === 'image'
                      ? <img
                          src={att.data}
                          alt={att.name}
                          onClick={() => setLightbox(att)}
                          className="w-8 h-8 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                        />
                      : <button
                          type="button"
                          onClick={() => window.open(att.data, '_blank')}
                          className="w-8 h-8 rounded-lg bg-morandi-blue/10 flex items-center justify-center shrink-0 hover:bg-morandi-blue/20 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-morandi-blue" />
                        </button>
                    }
                    <span className="text-xs text-graphite flex-1 truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => set('attachments', form.attachments.filter((_, j) => j !== i))}
                      className="p-0.5 text-graphite-soft/40 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          {error && (
            <p className="text-xs text-red-400 -mt-2">{error}</p>
          )}

          {/* 按鈕列 */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? '更新' : '建立'}
            </Button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-xl text-sm text-red-400 border border-red-200 hover:bg-red-50 transition-colors"
              >
                刪除
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, hint, required, children }) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-medium text-graphite-soft tracking-wide">
          {label}
          {required && <span className="text-morandi-blue ml-0.5">·</span>}
        </label>
        {hint && <span className="text-[11px] text-graphite-soft/70">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        'w-full box-border appearance-none bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite',
        'placeholder:text-graphite-soft/50',
        'focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40',
        'transition-shadow',
      )}
    />
  )
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full bg-cloud-white border border-divider rounded-xl px-3 py-2 text-sm text-graphite resize-none leading-relaxed',
        'placeholder:text-graphite-soft/50',
        'focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40',
        'transition-shadow',
      )}
    />
  )
}
