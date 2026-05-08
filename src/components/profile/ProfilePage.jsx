import { useState, useEffect } from 'react'
import { updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { LogOut, Camera, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ProfilePage({ user, onLogout }) {
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.displayName ?? '')
  const [imgError, setImgError] = useState(false)

  useEffect(() => { setImgError(false) }, [user?.photoURL])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSaveName = async () => {
    const name = nameInput.trim()
    if (!name) return
    setSaving(true)
    setSaveError('')
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      setEditingName(false)
    } catch {
      setSaveError('儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNameInput(user?.displayName ?? '')
    setEditingName(false)
    setSaveError('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 頭像 + 名稱 */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {user?.photoURL && !imgError ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-morandi-blue/20 flex items-center justify-center text-2xl font-medium text-morandi-blue">
                {user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-cloud-white border border-divider flex items-center justify-center">
              <Camera className="h-2.5 w-2.5 text-graphite-soft" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancel() }}
                  maxLength={30}
                  className="w-full bg-cloud-white border border-divider rounded-xl px-3 py-1.5 text-sm text-graphite focus:outline-none focus:ring-2 focus:ring-morandi-blue/30 focus:border-morandi-blue/40"
                />
                {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSaveName} disabled={saving} className="flex items-center gap-1 text-xs text-morandi-blue hover:text-morandi-blue/80 transition-colors">
                    <Check className="h-3 w-3" />
                    {saving ? '儲存中…' : '儲存'}
                  </button>
                  <button onClick={handleCancel} className="flex items-center gap-1 text-xs text-graphite-soft hover:text-graphite transition-colors">
                    <X className="h-3 w-3" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-base font-medium text-graphite truncate">{user?.displayName ?? '使用者'}</p>
                <p className="text-sm text-graphite-soft truncate mt-0.5">{user?.email}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="mt-1.5 text-xs text-morandi-blue hover:text-morandi-blue/80 transition-colors"
                >
                  修改名稱
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-graphite-soft/60 leading-relaxed">
          頭像來自 Google 帳號，如需更換請至 Google 帳號設定修改。
        </p>
      </Card>

      {/* 登出 */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-graphite">登出帳號</p>
            <p className="text-xs text-graphite-soft mt-0.5">登出後行程資料仍保留在雲端</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-red-400 hover:text-red-500 hover:bg-red-50 gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </div>
      </Card>

      {/* 版本號 */}
      <p className="text-center text-xs text-graphite-soft/40 pb-2">
        {import.meta.env.VITE_COMMIT_SHA
          ? `build ${import.meta.env.VITE_COMMIT_SHA.slice(0, 7)}`
          : 'dev'}
      </p>
    </div>
  )
}
