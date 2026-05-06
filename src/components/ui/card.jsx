import * as React from 'react'
import { cn } from '@/lib/utils'

export const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-cloud-white border border-divider/70 rounded-2xl shadow-zen',
        className,
      )}
      {...props}
    />
  )
})

export const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5', className)} {...props} />
})
