import { CalendarDays, Compass, BookHeart, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'calendar', label: '日期',  icon: CalendarDays },
  { id: 'timeline', label: '行程',  icon: Compass },
  { id: 'memory',   label: '回憶',  icon: BookHeart },
  { id: 'profile',  label: '我的',  icon: UserCircle },
]

export function TabBar({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-cloud-white/90 backdrop-blur-md border-t border-divider/70 safe-bottom">
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors',
                isActive ? 'text-graphite' : 'text-graphite-soft/70 hover:text-graphite-soft',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-105')} />
              <span className="text-[11px] tracking-wider font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
