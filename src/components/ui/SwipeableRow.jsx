import { useRef, useEffect } from 'react'

const THRESHOLD = 60

export function SwipeableRow({ children, actions, swipeOpen, onSwipeOpen }) {
  const actionWidth = actions.length * 72 // 每個 action 72px
  const elRef = useRef(null)
  const touchStart = useRef(null)
  const touchStartY = useRef(null)
  const isDragging = useRef(false)
  const isHorizontal = useRef(false)
  const swipeOpenRef = useRef(swipeOpen)

  useEffect(() => { swipeOpenRef.current = swipeOpen }, [swipeOpen])

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const onStart = (e) => {
      touchStart.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isDragging.current = false
      isHorizontal.current = false
    }

    const onMove = (e) => {
      if (touchStart.current === null) return
      const dx = e.touches[0].clientX - touchStart.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (!isHorizontal.current && Math.abs(dx) > 5) {
        if (Math.abs(dx) > Math.abs(dy)) isHorizontal.current = true
      }
      if (isHorizontal.current) {
        e.preventDefault()
        isDragging.current = true
      }
    }

    const onEnd = (e) => {
      if (touchStart.current === null) return
      const dx = e.changedTouches[0].clientX - touchStart.current
      touchStart.current = null
      touchStartY.current = null
      if (!isHorizontal.current) return
      if (dx < -THRESHOLD && !swipeOpenRef.current) { onSwipeOpen(true); return }
      if (dx > THRESHOLD && swipeOpenRef.current) { onSwipeOpen(false); return }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [onSwipeOpen])

  const handleClick = (e) => {
    if (isDragging.current) { e.stopPropagation(); return }
    if (swipeOpen) { onSwipeOpen(false); e.stopPropagation() }
  }

  return (
    <div ref={elRef} className="relative overflow-hidden rounded-2xl" onClick={handleClick}>
      {/* 右側 action 按鈕 */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: actionWidth }}
        aria-hidden="true"
      >
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); onSwipeOpen(false); action.onClick() }}
            className={action.className + ' flex flex-1 flex-col items-center justify-center gap-1 transition-colors'}
          >
            {action.icon}
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* 卡片本體 */}
      <div
        style={{
          transform: swipeOpen ? `translateX(-${actionWidth}px)` : 'translateX(0)',
          transition: 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
