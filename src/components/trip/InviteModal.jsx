import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createInvite } from '@/lib/invite'
import { cn } from '@/lib/utils'
import { Copy, Check, ChevronDown, Trash2 } from 'lucide-react'

const ROLES = [
  { value: 'viewer', label: '僅檢視', desc: '可查看行程，無法編輯' },
  { value: 'editor', label: '可共編', desc: '可新增、編輯、刪除行程' },
]

function Avatar({ name, photoURL }) {
  const [imgError, setImgError] = useState(false)
  const initial = name?.[0]?.toUpperCase() ?? '?'
  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={name}
        className="w-9 h-9 rounded-full object-cover shrink-0"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-morandi-blue/20 flex items-center justify-center text-sm text-morandi-blue font-medium shrink-0">
      {initial}
    </div>
  )
}

function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = ROLES.find(r => r.value === value) ?? ROLES[0]
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-graphite-soft px-2.5 py-1.5 rounded-full border border-divider hover:border-morandi-blue/40 transition-colors"
      >
        {current.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-cloud-white rounded-xl shadow-zen-lg border border-divider/60 overflow-hidden min-w-[100px]">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => { onChange(r.value); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors',
                  r.value === value
                    ? 'text-morandi-blue bg-morandi-blue/8'
                    : 'text-graphite hover:bg-divider/40',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function InviteModal({ open, onOpenChange, trip, uid }) {
  const [members, setMembers] = useState({})
  const [removing, setRemoving] = useState(null)

  // 邀請碼生成狀態
  const [inviteRole, setInviteRole] = useState('viewer')
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    if (!trip?.id || !trip?.ownerId) return
    const unsub = onSnapshot(doc(db, 'users', trip.ownerId, 'trips', trip.id), snap => {
      if (snap.exists()) setMembers(snap.data().members ?? {})
    })
    return unsub
  }, [trip?.id, trip?.ownerId])

  const tripRef = trip?.ownerId
    ? doc(db, 'users', trip.ownerId, 'trips', trip.id)
    : null

  const handleRoleChange = async (memberId, newRole) => {
    if (!tripRef) return
    await updateDoc(tripRef, { [`members.${memberId}.role`]: newRole })
  }

  const handleRemove = async (memberId) => {
    if (!tripRef) return
    setRemoving(memberId)
    try {
      await updateDoc(tripRef, { [`members.${memberId}`]: deleteField() })
    } finally {
      setRemoving(null)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const c = await createInvite({ tripId: trip.id, tripName: trip.name, role: inviteRole, createdBy: uid })
      setCode(c)
    } catch {
      setError('生成失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    const url = `${window.location.origin}${window.location.pathname}?invite=${code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setCode(null)
    setError('')
    setCopied(false)
    setShowInviteForm(false)
    setInviteRole('viewer')
    onOpenChange(false)
  }

  const memberList = Object.entries(members)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>成員管理</DialogTitle>
        </DialogHeader>

        {/* 現有成員列表 */}
        <div className="mb-5">
          {memberList.length === 0 ? (
            <p className="text-sm text-graphite-soft/60 py-3">尚無成員</p>
          ) : (
            <div className="space-y-0.5">
              {memberList.map(([memberId, m]) => {
                const isOwner = m.role === 'owner'
                const isSelf = memberId === uid
                const canEdit = !isOwner
                return (
                  <div key={memberId} className="flex items-center gap-3 py-2">
                    <Avatar name={m.displayName} photoURL={m.photoURL} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-graphite truncate">
                        {m.displayName}
                        {isSelf && <span className="ml-1 text-xs text-graphite-soft/50">（我）</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOwner ? (
                        <span className="text-xs text-graphite-soft/60 px-2 py-1 rounded-full bg-graphite/6">
                          擁有者
                        </span>
                      ) : (
                        <>
                          <RoleDropdown
                            value={m.role}
                            onChange={(newRole) => handleRoleChange(memberId, newRole)}
                          />
                          {!isSelf && (
                            <button
                              onClick={() => handleRemove(memberId)}
                              disabled={removing === memberId}
                              className="p-1.5 text-graphite-soft/40 hover:text-red-400 transition-colors"
                              title="移除成員"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 分隔線 */}
        <div className="border-t border-divider/60 mb-4" />

        {/* 邀請區塊 */}
        {!showInviteForm && !code && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="w-full py-3 rounded-2xl border border-dashed border-divider text-sm text-graphite-soft hover:border-morandi-blue/40 hover:text-morandi-blue transition-colors"
          >
            + 邀請新成員
          </button>
        )}

        {showInviteForm && !code && (
          <div className="animate-fade-in">
            <p className="text-xs text-graphite-soft mb-3">選擇權限後生成邀請碼</p>
            <div className="space-y-2 mb-4">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setInviteRole(r.value)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-2xl border transition-all duration-200',
                    inviteRole === r.value
                      ? 'border-morandi-blue/50 bg-morandi-blue/8 ring-1 ring-morandi-blue/30'
                      : 'border-divider hover:border-morandi-blue/30',
                  )}
                >
                  <p className="text-sm font-medium text-graphite">{r.label}</p>
                  <p className="text-xs text-graphite-soft mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowInviteForm(false); setError('') }}>取消</Button>
              <Button size="sm" onClick={handleGenerate} disabled={loading}>
                {loading ? '生成中…' : '生成邀請碼'}
              </Button>
            </div>
          </div>
        )}

        {code && (
          <div className="animate-fade-in">
            <div className="bg-morandi-blue/8 rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-graphite-soft mb-1">邀請碼</p>
              <p className="text-3xl font-medium text-graphite tracking-widest">{code}</p>
              <p className="text-xs text-graphite-soft/60 mt-2">
                {inviteRole === 'viewer' ? '僅檢視' : '可共編'} · 7 天內有效
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-divider hover:border-morandi-blue/40 transition-colors text-sm text-graphite-soft"
            >
              {copied ? <Check className="h-4 w-4 text-sage-green" /> : <Copy className="h-4 w-4" />}
              {copied ? '已複製連結' : '複製邀請連結'}
            </button>
            <p className="mt-3 text-xs text-graphite-soft/60 text-center">
              對方可直接開啟連結，或在 App 內輸入邀請碼加入。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setCode(null); setShowInviteForm(true) }}>再生成</Button>
              <Button variant="ghost" size="sm" onClick={handleClose}>完成</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
