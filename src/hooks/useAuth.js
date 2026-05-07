import { useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

const CACHE_KEY = 'zentravel:auth_user'

function readCachedUser() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch { return undefined }
}

function writeCachedUser(u) {
  if (u) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL,
    }))
  } else {
    localStorage.removeItem(CACHE_KEY)
  }
}

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
// PWA 模式（加到主畫面）：standalone 或 fullscreen display mode
const isPWA = window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches
  || window.navigator.standalone === true

export function useAuth() {
  const [user, setUser] = useState(() => readCachedUser())

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        writeCachedUser(result.user)
        setUser(result.user)
      }
    }).catch(() => {})

    const unsub = onAuthStateChanged(auth, (u) => {
      writeCachedUser(u)
      setUser(u ?? null)
    })
    return unsub
  }, [])

  const login = () => {
    // PWA 模式下 redirect 會丟失 session，一律用 popup
    // 一般 Safari 瀏覽器也改用 popup（iOS 16.4+ 已支援）
    if (isSafari && !isPWA) return signInWithRedirect(auth, googleProvider)
    return signInWithPopup(auth, googleProvider)
  }
  const logout = () => {
    writeCachedUser(null)
    return signOut(auth)
  }

  return { user, login, logout }
}
