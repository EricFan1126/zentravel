import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { auth } from '@/lib/firebase'

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function createInvite({ tripId, tripName, role, createdBy }) {
  const code = randomCode()
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  await setDoc(doc(db, 'invites', code), {
    tripId,
    tripName,
    role,
    createdBy,
    expiresAt,
  })
  return code
}

export async function acceptInvite(code, uid) {
  const ref = doc(db, 'invites', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('邀請碼不存在')
  const data = snap.data()
  if (data.expiresAt < Date.now()) throw new Error('邀請碼已過期')

  const tripRef = doc(db, 'users', data.createdBy, 'trips', data.tripId)
  const tripSnap = await getDoc(tripRef)
  if (!tripSnap.exists()) throw new Error('旅程不存在')

  // 把成員資料（uid、名稱、頭像、權限）寫入 owner 的旅程
  const user = auth.currentUser
  await updateDoc(tripRef, {
    [`members.${uid}`]: {
      role: data.role,
      displayName: user?.displayName ?? '旅伴',
      photoURL: user?.photoURL ?? null,
      joinedAt: Date.now(),
    },
  })

  return {
    tripId: data.tripId,
    role: data.role,
    tripName: data.tripName,
    ownerId: data.createdBy,
  }
}
