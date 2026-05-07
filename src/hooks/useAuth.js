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

export function useAuth() {
  const [user, setUser] = useState(() => readCachedUser())
  const [redirectError, setRedirectError] = useState(null)

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        writeCachedUser(result.user)
        setUser(result.user)
      }
    }).catch((err) => {
      console.error('getRedirectResult error:', err)
      setRedirectError(err?.code + ': ' + err?.message)
    })

    const unsub = onAuthStateChanged(auth, (u) => {
      writeCachedUser(u)
      setUser(u ?? null)
    })
    return unsub
  }, [])

  const login = () => {
    if (isSafari) return signInWithRedirect(auth, googleProvider)
    return signInWithPopup(auth, googleProvider)
  }
  const logout = () => {
    writeCachedUser(null)
    return signOut(auth)
  }

  return { user, login, logout, redirectError }
}
