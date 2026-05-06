import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fileToDataUrl, saveMemory, deleteMemory } from '@/lib/storage'
import { formatTime, formatDateLabel } from '@/lib/time'

const CAPTION_MAX = 80

export function MemoryEditor({ event, open, onOpenChange, onSaved }) {
  const [photo, setPhoto] = useState(event.memory?.photo ?? null)
  const [caption, setCaption] = useState(event.memory?.caption ?? '')
  const [busy, setBusy] = useState(false)

  // 開啟時重新從 event.memory 同步狀態
  useEffect(() => {
    if (open) {
      setPhoto(event.memory?.photo ?? null)
      setCaption(event.memory?.caption ?? '')
    }
  }, [open, event.memory])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const url = await fileToDataUrl(file)
      setPhoto(url)
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => {
    saveMemory(event.id, { photo, caption: caption.trim() })
    onSaved?.()
    onOpenChange(false)
  }

  const handleClear = () => {
    deleteMemory(event.id)
    setPhoto(null)
    setCaption('')
    onSaved?.()
    onOpenChange(false)
  }

  const hasMemory = !!event.memory
  const canSave = (photo || caption.trim()) && !busy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>
            {formatDateLabel(event.startTime)} · {formatTime(event.startTime)} — {formatTime(event.endTime)}
          </DialogDescription>
        </DialogHeader>

        {/* 照片區 */}
        <label className="block cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          {photo ? (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-divider/40">
              <img
                src={photo}
                alt="回憶照片"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-graphite/0 group-hover:bg-graphite/20 transition-colors flex items-center justify-center">
                <span className="text-xs text-cloud-white opacity-0 group-hover:opacity-100 transition-opacity">
                  點擊換一張
                </span>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-xl border border-dashed border-divider flex flex-col items-center justify-center text-graphite-soft hover:border-morandi-blue/50 hover:text-morandi-blue transition-colors">
              <ImagePlus className="h-6 w-6 mb-2" />
              <span className="text-xs">放一張當下的照片</span>
            </div>
          )}
        </label>

        {/* 心情輸入 */}
        <div className="mt-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))}
            placeholder="一句話寫下當下的心情⋯"
            rows={3}
            className="w-full bg-cloud-white border border-divider rounded-xl p-3 text-sm text-graphite placeholder:text-graphite-soft/60 resize-none focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 transition-shadow"
          />
          <div className="mt-1 flex justify-end">
            <span className="text-xs text-graphite-soft tabular-nums">
              {caption.length} / {CAPTION_MAX}
            </span>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {hasMemory ? (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              清除回憶
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="default"
            onClick={handleSave}
            disabled={!canSave}
          >
            {hasMemory ? '更新回憶' : '保存回憶'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
