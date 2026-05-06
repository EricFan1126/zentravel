import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

function Avatar({ name, photoURL }) {
  const [imgError, setImgError] = useState(false)
  const initial = name?.[0]?.toUpperCase() ?? '?'
  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={name}
        className="w-6 h-6 rounded-full border-2 border-cloud-white object-cover"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-cloud-white bg-morandi-blue/30 flex items-center justify-center text-[10px] text-morandi-blue font-medium">
      {initial}
    </div>
  )
}

// 即時監聽旅程的 members 並顯示頭像
export function MemberAvatars({ trip }) {
  const [members, setMembers] = useState({})

  useEffect(() => {
    const ownerId = trip.sharedFrom ?? trip.ownerId
    if (!ownerId || !trip.id) return
    const unsub = onSnapshot(doc(db, 'users', ownerId, 'trips', trip.id), snap => {
      if (snap.exists()) setMembers(snap.data().members ?? {})
    })
    return unsub
  }, [trip.id, trip.ownerId, trip.sharedFrom])

  const list = Object.entries(members)
  if (list.length === 0) return null

  return (
    <div className="flex items-center mt-2 -space-x-1.5">
      {list.slice(0, 5).map(([uid, m]) => (
        <div key={uid} title={m.displayName} className="relative">
          <Avatar name={m.displayName} photoURL={m.photoURL} />
          <span className="sr-only">{m.displayName} · {m.role === 'editor' ? '可共編' : '僅檢視'}</span>
        </div>
      ))}
      {list.length > 5 && (
        <div className="w-6 h-6 rounded-full border-2 border-cloud-white bg-graphite/10 flex items-center justify-center text-[10px] text-graphite-soft">
          +{list.length - 5}
        </div>
      )}
    </div>
  )
}
