import {
  Plane,
  UtensilsCrossed,
  Camera,
  BedDouble,
  ShoppingBag,
  Sparkles,
  MapPin,
} from 'lucide-react'

// 行程類型 — 圖示使用 lucide-react，避免再裝額外圖示套件。
// 順序即「新增/編輯」表單裡的下拉順序。
export const EVENT_TYPES = [
  { id: 'transit',     label: '交通', icon: Plane,           color: 'text-graphite-soft' },
  { id: 'food',        label: '用餐', icon: UtensilsCrossed, color: 'text-morandi-blue' },
  { id: 'sightseeing', label: '景點', icon: Camera,          color: 'text-sage-green' },
  { id: 'lodging',     label: '住宿', icon: BedDouble,       color: 'text-graphite-soft' },
  { id: 'shopping',    label: '購物', icon: ShoppingBag,     color: 'text-morandi-blue' },
  { id: 'activity',    label: '活動', icon: Sparkles,        color: 'text-sage-green' },
  { id: 'other',       label: '其他', icon: MapPin,          color: 'text-graphite-soft' },
]

const TYPE_MAP = Object.fromEntries(EVENT_TYPES.map(t => [t.id, t]))

export function getEventType(id) {
  return TYPE_MAP[id] ?? TYPE_MAP['other']
}
