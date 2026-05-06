import { useEffect, useState } from 'react'

// 每 60 秒回傳一個新的 Date — 讓置頂行程能自動跟著時間滾動。
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
